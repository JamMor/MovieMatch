from django.contrib import admin

from .models import Movie, Persona, SavedMovieList, TempMovieList


class SavedMovieListAdmin(admin.ModelAdmin):
    readonly_fields = ['display_name']

class PersonaAdmin(admin.ModelAdmin):
    list_display = ['id','uuid', 'nickname', 'user_account', 'created_at', 'updated_at']
    list_select_related = ['user_account']
    ordering = ['-updated_at']

admin.site.register(SavedMovieList, SavedMovieListAdmin)
admin.site.register(Persona, PersonaAdmin)
admin.site.register(Movie)
admin.site.register(TempMovieList)