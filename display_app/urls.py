from django.urls import path
from . import views

app_name = "selection"
urlpatterns = [
    path('', views.index, name="main_page"),
    path('match', views.new_match, name="new_match"),
    path('match/<int:sharecode>', views.join_match, name="join_match"),
    path('new', views.new_list, name="new_list"),
    path('update', views.update_shared, name="update_shared"),
    path('delete', views.delete_shared, name="delete_shared"),
]