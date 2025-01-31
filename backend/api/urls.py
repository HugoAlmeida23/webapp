from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Criar um router para o ViewSet de Faturas
router = DefaultRouter()
router.register(r'faturas', views.FaturaViewSet, basename='fatura')  # Rotas automáticas para CRUD

urlpatterns = [
    # Rotas para Notes
    path("notes/", views.NoteListCreate.as_view(), name="note-list"),
    path("notes/delete/<int:pk>/", views.NoteDelete.as_view(), name="delete-note"),

    # Rotas para Faturas
    path("faturas/", views.FaturaListCreate.as_view(), name="fatura-create"),
    path("faturas/delete/<int:pk>/", views.FaturaDelete.as_view(), name="delete-fatura"),

    # Lista de Entidades únicas
    path("faturas/entidades/", views.EntidadeList.as_view(), name="entidade-list"),

    # Inclui as rotas do ViewSet (CRUD completo)
    path("", include(router.urls)),
]
