from django.db import models

# Create your models here.
class CategoryRule(models.Model):
    CATEGORY_CHOICES = [
        ('Category_1', 'Category 1'),
        ('Category_2', 'Category 2'),
        ('Category_3', 'Category 3'),
        ('Category_4', 'Category 4'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    batch = models.CharField(max_length=50)  # e.g., BE_2023, BE_2024
    minimum_academic_attendance = models.FloatField(null=True, blank=True)  # Minimum academic attendance
    minimum_academic_performance = models.FloatField(null=True, blank=True)  # Minimum academic performance
    minimum_training_attendance = models.FloatField(null=True, blank=True)  # Minimum training attendance
    minimum_training_performance = models.FloatField(null=True, blank=True)  # Minimum training performance

    class Meta:
        unique_together = ('category', 'batch')  # Ensure unique rules per category and batch
        ordering = ['category']  # Evaluate in order: Category_1, Category_2, Category_3, Category_4

    def __str__(self):
        return f"{self.category} - {self.batch}"