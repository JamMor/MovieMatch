from django.urls import path
from . import views

app_name = "list_builder"
urlpatterns = [
    path('', views.index, name="list_builder"),
    path('list_manager', views.list_manager, name="list_manager"),
    path('save/<int:list_id>', views.save, name="save_list"),
    path('save', views.save, name="save_list"),
    path('edit/<int:list_id>', views.edit, name="edit_list"),
    path('delete/<int:list_id>', views.delete, name="delete_list"),
    path('', views.index, name="default_redirect")
]