from django.forms import ModelForm
from .models import SavedMovieList


class SavedMovieListForm(ModelForm):
    class Meta:
        model = SavedMovieList
        fields = ['list_name']

    def __init__(self, *args, **kwargs):
        super(SavedMovieListForm, self).__init__(*args, **kwargs)

        self.fields['list_name'].widget.attrs['class'] = 'validate center-align'
        self.fields['list_name'].widget.attrs['pattern'] = '^$|^[2-9a-hj-np-zA-HJ-NP-Z]{8}$'

    def is_valid(self):
        result = super().is_valid()
        # loop on *all* fields if key '__all__' found else only on errors:
        for x in (self.fields if '__all__' in self.errors else self.errors):
            attrs = self.fields[x].widget.attrs
            attrs.update({'class': attrs.get('class', '') + ' invalid'})
        return result
