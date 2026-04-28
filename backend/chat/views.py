from rest_framework import generics, viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    ChatRequestSerializer,
    MessageSerializer,
)
from .services import call_gemini, build_history_from_messages


class ConversationViewSet(viewsets.ModelViewSet):
    """
    GET    /api/conversations/         → liste mes conversations
    POST   /api/conversations/         → en crée une vide
    GET    /api/conversations/{id}/    → détail + messages
    PATCH  /api/conversations/{id}/    → renomme / favori
    DELETE /api/conversations/{id}/    → supprime
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # SÉCURITÉ : un user ne voit QUE ses conversations
        return Conversation.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ConversationDetailSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatView(APIView):
    """POST /api/chat/  →  envoie un message, reçoit la réponse du bot."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Récupère ou crée la conversation
        conv_id = data.get("conversation_id")
        if conv_id:
            try:
                conversation = Conversation.objects.get(id=conv_id, user=request.user)
            except Conversation.DoesNotExist:
                return Response({"detail": "Conversation introuvable."}, status=404)
        else:
            conversation = Conversation.objects.create(
                user=request.user,
                title=data["content"][:50],  # titre auto = début du message
            )

        # 2. Sauvegarde le message utilisateur
        user_msg = Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=data["content"],
        )

        # 3. Construit l'historique (8 derniers échanges max, hors message courant)
        history_messages = (
            conversation.messages.exclude(id=user_msg.id).order_by("-created_at")[:16][::-1]
        )
        history = build_history_from_messages(history_messages)

        # 4. Appelle Gemini
        try:
            result = call_gemini(data["content"], history=history)
        except Exception as e:
            return Response(
                {"detail": f"Erreur Gemini : {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # 5. Sauvegarde la réponse du bot
        bot_msg = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=result["text"],
            source=Message.Source.LLM,  # FAQ viendra à l'étape 5
            tokens_used=result["tokens_used"],
        )

        # 6. Touch updated_at sur la conversation pour qu'elle remonte en tête de liste
        conversation.save()

        return Response({
            "conversation_id": str(conversation.id),
            "user_message": MessageSerializer(user_msg).data,
            "assistant_message": MessageSerializer(bot_msg).data,
        }, status=status.HTTP_201_CREATED)