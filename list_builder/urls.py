from django.urls import path
from . import views

app_name = "list_builder"
urlpatterns = [
    path('', views.index, name="list_builder"),
    path('list_manager', views.list_manager, name="list_manager"),
    path('save', views.save, name="save_list"),
    path('delete/<int:list_id>', views.delete, name="delete_list"),
    path('test', views.test, name="test"),
    path('', views.index, name="default_redirect")
]