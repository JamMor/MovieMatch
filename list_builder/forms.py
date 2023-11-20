from django import forms
from django.forms import ModelForm, ValidationError

from .models import SavedMovieList
from .validators import UserInputValidator

user_input_validator = UserInputValidator()


class SavedMovieListForm(ModelForm):
    class Meta:
        model = SavedMovieList
        fields = ['list_name']

    def __init__(self, *args, **kwargs):
        super(SavedMovieListForm, self).__init__(*args, **kwargs)

        self.fields['list_name'].widget.attrs['class'] = 'validate center-align'
        self.fields['list_name'].widget.attrs['pattern'] = user_input_validator.htmlPatternString()
        self.fields['list_name'].widget.attrs['title'] = user_input_validator.htmlTitleString()

    def is_valid(self):
        result = super().is_valid()
        # loop on *all* fields if key '__all__' found else only on errors:
        for x in (self.fields if '__all__' in self.errors else self.errors):
            attrs = self.fields[x].widget.attrs
            attrs.update({'class': attrs.get('class', '') + ' invalid'})
        return result


class HiddenListNameForm(SavedMovieListForm):
    class Meta(SavedMovieListForm.Meta):
        widgets = {'list_name': forms.HiddenInput()}



class MovieTmdbIdsForm(forms.Form):
    tmdb_ids = forms.JSONField(
        error_messages={'required': 'Cannot save an empty list.'},
    )

    def clean_tmdb_ids(self):
        tmdb_ids = self.cleaned_data['tmdb_ids']
        for tmdb_id in tmdb_ids:
            if not isinstance(tmdb_id, int):
                raise ValidationError(f"Invalid movie id: {tmdb_id}")
        return tmdb_ids
