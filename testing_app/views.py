from django.shortcuts import render

#Display sample icons
def test(request):
    return render(request,'testing_app/test.html')