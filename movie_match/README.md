# MovieMatch Project Folder Documentation

This directory of the Django project contains code that will be used throughout all of the apps (currently: login_and_reg, list_builder, and elimination_room).

---

## Settings

### **base.py**
Settings consists of the ```base.py``` file, which contains the base settings for the project, and will be the default if no settings modules are specified. The default base settings are the simplest for the project to work, ***however***, for security, ```DEBUG``` is set to ```False```. (In case of improper settings configuration, you wouldn't want the project defaulting to debug mode on a public server.) When DEBUG mode is False, Django will not handle serving static files itself, and allowed hosts will need to be specified explicitly.

The ```dotenv``` package is used to load environment variables, however it won't overwrite any variables already set. This means that if the variables are set through the environment—as they are when running with Docker compose—the variables piped in from the ```.env``` file specified in the docker compose file will take precedence over any ```.env``` file inside the project itself.

The settings controlled by the ```.env``` are discussed in more detail [here](/README.md/#1-the-env-file).

---

Django settings can be split into modules, which in this case extend and overwrite the ```base.py``` settings. For MovieMatch, the available ```DJANGO_SETTINGS_MODULE``` options are [movie_match.settings.dev](#devpy)
and [movie_match.settings.prod](#prodpy). Defaults to ```base.py``` if not provided.

---


### **dev.py**
```DJANGO_SETTINGS_MODULE=movie_match.settings.dev```

The development settings module sets the single setting of ```DEBUG = True```, allowing Django to serve static files from its development server and setting allowed hosts to ```localhost```.

### **prod.py**
```DJANGO_SETTINGS_MODULE=movie_match.settings.prod```

The production settings module runs with ```DEBUG = False```. Because of this, ```ALLOWED_HOSTS``` must be set and a method of serving the static files used. The module also includes settings that enforce HTTPS, so the user must configure security certificates, and set up their server appropriately.

---

## Static
The static directory containes all of the static files for the project that are common to multiple apps. This includes some overarching CSS, the favicons, images, and most importantly Javascript files.

The javascript files include prepping the csrf token, login submission, dynamic element constructors, list save function, and various modals that recur throughout the project.

## Templates

The templates include HTML templates that are used throughout the apps. These include the base template, which is extended by all other templates, and and consists of the navbars, and *any* base static files that need to be loaded such as the css and aforementioned JS files.

Also included is the html for both the movie_info_modal and save_modal that can be called from any app.

The form_template will dynamically generate forms from Django form classes, complete with tooltips, error handling, and styling. Currently used for registration and profile forms.