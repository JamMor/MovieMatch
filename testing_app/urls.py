from django.urls import path

from . import views

app_name = "testing_app"
urlpatterns = [
    path('', views.test, name="test")
]
