from rest_framework.routers import DefaultRouter
from department.api_views import DepartmentViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = router.urls
