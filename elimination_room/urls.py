from django.urls import path

from . import views

app_name = "elimination_room"
urlpatterns = [
    path('', views.new_match, name="share_submit"),
    path('<str:sharecode>', views.join_match, name="match_room")
]
