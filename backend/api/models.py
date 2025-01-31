from django.db import models
from django.contrib.auth.models import User


class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    fatura_id = models.IntegerField(default="1")

    def __str__(self):
        return self.title

class Fatura(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="faturas", null=True, blank=True)  # Relacionado ao usuário logado
    description = models.CharField(max_length=255, null=True, blank=True)  # Descrição da fatura
    entidade = models.CharField(max_length=255, null=True, blank=True, default="Desconhecido")  # Entidade
    nif = models.CharField(max_length=20, null=True, blank=True, default="Desconhecido")  # NIF
    pais = models.CharField(max_length=100, null=True, blank=True, default="Desconhecido")  # País
    data = models.DateField(null=True, blank=True, default="2024-01-01")  # Data
    tipo = models.CharField(max_length=100, null=True, blank=True, default="Tipo Desconhecido") #
    numero_fatura = models.CharField(max_length=50, null=True, blank=True, default="Desconhecido")  # Número da Fatura
    iva_6 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)  # IVA 6%
    iva_23 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)  # IVA 23%
    total_iva = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)  # Total IVA
    total_sem_iva = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)  # Total sem IVA
    total_fatura = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)  # Total da Fatura
    tipo_entidade = models.CharField(max_length=100, null=True, blank=True, default="Desconhecido") #
    classificacao = models.CharField(max_length=100, null=True, blank=True, default="Desconhecido") #
    created_at = models.DateTimeField(auto_now_add=True)  # Criado automaticamente
    file_url = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"Fatura {self.numero_fatura} - {self.description} - {self.total_fatura}"
