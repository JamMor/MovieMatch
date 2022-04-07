from django.urls import path
from . import views

app_name = "list_builder"
urlpatterns = [
    path('', views.index, name="list_builder")
]