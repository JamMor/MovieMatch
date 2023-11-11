from django.contrib.staticfiles.storage import ManifestStaticFilesStorage

class ManifestStaticFilesStorageNotStrict(ManifestStaticFilesStorage):
    """A relaxed implementation of django's ManifestStaticFilesStorage.
    """
    manifest_strict = False