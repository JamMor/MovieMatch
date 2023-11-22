from django.contrib import admin

from .models import EliminationSession, EliminationSessionUser, SharedMovie


class SharedMovieInline(admin.TabularInline):
    model = SharedMovie
    readonly_fields = ['movie']
    fields = ['movie', 'is_eliminated']
    exclude = ['submitted_by']
    extra = 0


class EliminationSessionAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'sharecode',
        'shared_movies_count',
        'created_at',
        'updated_at'
    ]
    exclude = ['contributors']
    inlines = [SharedMovieInline]
    ordering = ['-updated_at']

    def shared_movies_count(self, obj):
        return obj.shared_movies.count()


class EliminationSessionUserAdmin(admin.ModelAdmin):
    list_display = ['nickname', 'persona', 'elimination_session']


class SharedMovieAdmin(admin.ModelAdmin):
    list_display = ['elimination_session', 'movie']


admin.site.register(EliminationSession, EliminationSessionAdmin)
admin.site.register(SharedMovie, SharedMovieAdmin)
admin.site.register(EliminationSessionUser, EliminationSessionUserAdmin)
