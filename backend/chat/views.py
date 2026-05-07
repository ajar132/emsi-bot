from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationDetailSerializer,
    ChatRequestSerializer, MessageSerializer,
)
from .services import call_gemini, build_history_from_messages
from knowledge.services import route_query


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ConversationDetailSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatView(APIView):
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
                user=request.user, title=data["content"][:50],
            )

        # 2. Sauvegarde le message utilisateur
        user_msg = Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=data["content"],
        )

        # 3. ROUTAGE — décide FAQ vs LLM
        try:
            routing = route_query(data["content"])
        except Exception as e:
            return Response({"detail": f"Erreur routing : {e}"}, status=503)

        # 4. Génère la réponse selon la stratégie
        try:
            if routing["strategy"] == "DIRECT_FAQ":
                # Réponse FAQ directe — pas d'appel LLM
                bot_msg = Message.objects.create(
                    conversation=conversation,
                    role=Message.Role.ASSISTANT,
                    content=routing["faq"].answer,
                    source=Message.Source.FAQ,
                    faq_entry=routing["faq"],
                    tokens_used=0,
                )
            else:
                # Appel Gemini, avec ou sans contexte FAQ
                history_messages = (
                    conversation.messages.exclude(id=user_msg.id).order_by("-created_at")[:16][::-1]
                )
                history = build_history_from_messages(history_messages)

                user_query = data["content"]
                source = Message.Source.LLM
                faq_used = None
                if routing["strategy"] == "LLM_WITH_CONTEXT":
                    user_query = (
                        f"Voici une réponse possible issue de notre FAQ :\n\n"
                        f"« {routing['faq'].answer} »\n\n"
                        f"Reformule ou complète cette réponse pour la question suivante :\n"
                        f"{data['content']}"
                    )
                    source = Message.Source.HYBRID
                    faq_used = routing["faq"]

                result = call_gemini(user_query, history=history)
                bot_msg = Message.objects.create(
                    conversation=conversation,
                    role=Message.Role.ASSISTANT,
                    content=result["text"],
                    source=source,
                    faq_entry=faq_used,
                    tokens_used=result["tokens_used"],
                )
        except Exception as e:
            return Response({"detail": f"Erreur Gemini : {e}"}, status=503)

        conversation.save()  # touch updated_at

        return Response({
            "conversation_id": str(conversation.id),
            "user_message": MessageSerializer(user_msg).data,
            "assistant_message": MessageSerializer(bot_msg).data,
            "routing": {  # bonus debug — utile à Ziad et au jury
                "strategy": routing["strategy"],
                "faq_score": round(routing["score"], 4),
            },
        }, status=status.HTTP_201_CREATED)