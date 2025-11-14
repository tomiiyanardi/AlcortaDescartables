from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, VentaViewSet, ItemVentaViewSet

# Creamos un enrutador
router = DefaultRouter()

# Registramos nuestras vistas en el enrutador
# DRF se encarga de crear las rutas (ej. /productos/ y /productos/1/)
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'items-venta', ItemVentaViewSet, basename='itemventa')

# Las URLs de la API son generadas automáticamente por el enrutador
urlpatterns = router.urls