from django.contrib import admin

from .models import SharedMovieList, SharedMovie, ShareRoomUser
# Register your models here.

class SharedMovieInline(admin.TabularInline):
    model = SharedMovie
    readonly_fields = ['movie']
    fields = ['movie', 'is_eliminated']
    exclude = ['submitted_by']
    extra = 0

class SharedMovieListAdmin(admin.ModelAdmin):
    list_display =  ['id', 'sharecode', 'shared_movies_count', 'created_at', 'updated_at']
    exclude = ['contributors']
    inlines = [SharedMovieInline]
    ordering = ['-updated_at']

    def shared_movies_count(self, obj):
        return obj.shared_movies.count()

class ShareRoomUserAdmin(admin.ModelAdmin):
    list_display = ['nickname', 'persona', 'list']

class SharedMovieAdmin(admin.ModelAdmin):
    list_display = ['shared_list', 'movie']

admin.site.register(SharedMovieList, SharedMovieListAdmin)
admin.site.register(SharedMovie, SharedMovieAdmin)
admin.site.register(ShareRoomUser, ShareRoomUserAdmin)