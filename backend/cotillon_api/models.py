from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

# -----------------------------------------------------------------------------
# Modelo: Producto
# -----------------------------------------------------------------------------
class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    codigo = models.CharField(max_length=100, unique=True, blank=True, null=True)
    precio_costo = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    precio_venta = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    stock = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0.000'))
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal('0.000'))

    def __str__(self):
        return f"{self.nombre} (ID: {self.id})"

# -----------------------------------------------------------------------------
# Modelo: Venta (¡MODIFICADO!)
# -----------------------------------------------------------------------------
class Venta(models.Model):
    # Opciones para el método de pago
    METODOS_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]

    fecha = models.DateTimeField(auto_now_add=True)
    total_venta = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # --- NUEVO CAMPO ---
    metodo_pago = models.CharField(
        max_length=20, 
        choices=METODOS_PAGO, 
        default='EFECTIVO' # Valor por defecto para ventas viejas
    )
    
    productos = models.ManyToManyField(
        Producto,
        through='ItemVenta',
        related_name='ventas'
    )

    def __str__(self):
        return f"Venta #{self.id} ({self.metodo_pago})"

# -----------------------------------------------------------------------------
# Modelo: ItemVenta
# -----------------------------------------------------------------------------
class ItemVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3, validators=[MinValueValidator(Decimal('0.001'))])
    precio_en_el_momento = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"