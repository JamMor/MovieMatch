from django import forms
from django.forms import ModelForm, ValidationError
from .models import SharedMovieList, ShareRoomUser


class SharecodeForm(ModelForm):
    class Meta:
        model = SharedMovieList
        fields = ['sharecode']

    def __init__(self, *args, **kwargs):
        super(SharecodeForm, self).__init__(*args, **kwargs)

        self.fields['sharecode'].required = False
        self.fields['sharecode'].widget.attrs['class'] = 'validate center-align'
        # self.fields['sharecode'].widget.attrs['pattern'] = '^$|^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$'
        self.fields['sharecode'].widget.attrs['pattern'] = '^$|^[2-9a-hj-np-zA-HJ-NP-Z]{8}$'
        self.fields['sharecode'].widget.attrs['minlength'] = '8'
        self.fields['sharecode'].widget.attrs['data-length'] = '8'
        self.fields['sharecode'].widget.attrs['style'] = 'text-transform:uppercase'

    def clean_sharecode(self):
        sharecode = self.cleaned_data['sharecode']
        if sharecode == '':
            return sharecode

        sharecode = sharecode.upper()
        if SharedMovieList.objects.filter(sharecode=sharecode).exists():
            return sharecode
        else:
            raise ValidationError("Sharecode does not exist.")

    def is_valid(self):
        result = super().is_valid()
        # loop on *all* fields if key '__all__' found else only on errors:
        for x in (self.fields if '__all__' in self.errors else self.errors):
            attrs = self.fields[x].widget.attrs
            attrs.update({'class': attrs.get('class', '') + ' invalid'})
        return result


class ShareRoomUserForm(ModelForm):
    class Meta:
        model = ShareRoomUser
        fields = ['nickname']

    def __init__(self, *args, **kwargs):
        super(ShareRoomUserForm, self).__init__(*args, **kwargs)

        self.fields['nickname'].widget.attrs['class'] = 'validate center-align'
        self.fields['nickname'].widget.attrs['data-length'] = '20'

    def is_valid(self):
        result = super().is_valid()
        if 'nickname' in self.errors:
            attrs = self.fields['nickname'].widget.attrs
            attrs.update({'class': attrs.get('class', '') + ' invalid'})
        return result
    

class MovieTmdbIdsForm(forms.Form):
    tmdb_ids = forms.JSONField(
        required=False
    )

    def clean_tmdb_ids(self):
        tmdb_ids = self.cleaned_data['tmdb_ids']
        for tmdb_id in tmdb_ids:
            if not isinstance(tmdb_id, int):
                raise ValidationError(f"Invalid movie id: {tmdb_id}")
        return tmdb_ids
