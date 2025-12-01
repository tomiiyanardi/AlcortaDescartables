from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Venta, ItemVenta, Producto

@transaction.atomic
def registrar_venta(validated_data):
    items_data = validated_data.pop('items')
    
    # --- CORRECCIÓN AQUÍ ---
    # Extraemos el método de pago de los datos validados. 
    # Si no viene (por alguna razón), usamos 'EFECTIVO' por defecto.
    metodo_pago = validated_data.get('metodo_pago', 'EFECTIVO')
    
    # Creamos la venta incluyendo el método de pago
    venta = Venta.objects.create(
        total_venta=Decimal('0.00'),
        metodo_pago=metodo_pago 
    )
    # -----------------------

    total_venta_calculado = Decimal('0.00')

    productos_a_actualizar = []
    items_a_crear = []

    for item_data in items_data:
        producto = item_data['producto']
        cantidad = item_data['cantidad']
        
        # Validación de Stock (usando Decimal)
        if producto.stock < cantidad:
            raise ValidationError(f"No hay suficiente stock para {producto.nombre}. Stock actual: {producto.stock}")

        precio_en_el_momento = producto.precio_venta
        
        producto.stock -= cantidad
        productos_a_actualizar.append(producto)
        
        total_venta_calculado += precio_en_el_momento * cantidad
        
        items_a_crear.append(ItemVenta(
            venta=venta, 
            producto=producto, 
            cantidad=cantidad, 
            precio_en_el_momento=precio_en_el_momento
        ))

    ItemVenta.objects.bulk_create(items_a_crear)
    Producto.objects.bulk_update(productos_a_actualizar, ['stock'])
    
    venta.total_venta = total_venta_calculado
    venta.save()
    
    # Devolvemos los items a validated_data por si el serializer los necesita
    validated_data['items'] = items_data
    return venta, validated_data

# --- SERVICIO PARA EDICIÓN DE VENTA ---
# Nota: Este servicio actualmente no se usa directamente si estás usando
# la lógica de update() en el Serializer, pero es bueno mantenerlo actualizado
# o sincronizado por si decides usarlo en el futuro.
@transaction.atomic
def actualizar_venta(venta_instance, validated_data):
    items_data = validated_data.pop('items')
    
    # Actualizamos método de pago si viene en los datos
    if 'metodo_pago' in validated_data:
        venta_instance.metodo_pago = validated_data['metodo_pago']

    # 1. REVERTIR STOCK (Devolver productos al estante)
    current_items = venta_instance.items.all()
    for item in current_items:
        producto = item.producto
        producto.stock += item.cantidad 
        producto.save()
    
    # 2. Borrar items viejos
    current_items.delete()

    # 3. APLICAR NUEVA VENTA
    total_venta_calculado = Decimal('0.00')
    items_a_crear = []
    productos_a_actualizar = [] 

    for item_data in items_data:
        producto = item_data['producto']
        cantidad = item_data['cantidad']
        
        # Verificar stock
        if producto.stock < cantidad:
             raise ValidationError(f"No hay suficiente stock para {producto.nombre}. Stock disponible: {producto.stock}")
        
        precio_en_el_momento = producto.precio_venta 
        
        producto.stock -= cantidad
        productos_a_actualizar.append(producto)
        
        total_venta_calculado += precio_en_el_momento * cantidad
        items_a_crear.append(ItemVenta(
            venta=venta_instance, 
            producto=producto, 
            cantidad=cantidad, 
            precio_en_el_momento=precio_en_el_momento
        ))

    ItemVenta.objects.bulk_create(items_a_crear)
    Producto.objects.bulk_update(productos_a_actualizar, ['stock'])
    
    venta_instance.total_venta = total_venta_calculado
    venta_instance.save()
    
    return venta_instance