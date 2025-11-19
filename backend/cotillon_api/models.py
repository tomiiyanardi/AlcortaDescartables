from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    codigo = models.CharField(max_length=100, unique=True, blank=True, null=True)
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    stock = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00')) # CAMBIO: DecimalField
    stock_minimo = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.nombre} (ID: {self.id})"

class Venta(models.Model):
    fecha = models.DateTimeField(auto_now_add=True)
    total_venta = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    productos = models.ManyToManyField(
        Producto,
        through='ItemVenta',
        related_name='ventas'
    )

    def __str__(self):
        return f"Venta ID: {self.id} - Fecha: {self.fecha.strftime('%Y-%m-%d %H:%M')}"

class ItemVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2) # CAMBIO: DecimalField
    precio_en_el_momento = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} @ ${self.precio_en_el_momento}"