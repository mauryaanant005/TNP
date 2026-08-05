from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible

MB = 1024 * 1024


@deconstructible
class MaxFileSizeValidator:
    def __init__(self, max_mb):
        self.max_mb = max_mb

    def __call__(self, f):
        if f.size > self.max_mb * MB:
            raise ValidationError(f"File too large. Maximum size is {self.max_mb}MB.")

    def __eq__(self, other):
        return isinstance(other, MaxFileSizeValidator) and self.max_mb == other.max_mb


validate_image_size = MaxFileSizeValidator(5)
validate_document_size = MaxFileSizeValidator(10)
validate_attachment_size = MaxFileSizeValidator(10)
