from django.shortcuts import render


def test(request):
    return render(request, 'testing_app/test.html')
