from django.db import models
from django.contrib.auth.models import User

from .Product_Explorer import Product



# Project Representation Logic
class ProjectIdea(models.Model):
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Beginner')
    tags = models.CharField(max_length=200, help_text="e.g. 'robot, iot, arduino'")
    
    student_name = models.CharField(max_length=100, default="Admin")
    university = models.CharField(max_length=200, default="Tech University")
    category = models.CharField(max_length=100, default="IoT")
    image_url = models.URLField(max_length=500, blank=True, null=True)
    clones = models.IntegerField(default=0)
    
    components = models.ManyToManyField(Product, related_name='project_ideas')

    def __str__(self):
        return self.title


# Clone Logic
class ProjectCloneLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey('ProjectIdea', on_delete=models.CASCADE)
    cloned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} cloned {self.project.title}"


# Review Logic
class ProjectReview(models.Model):
    project = models.ForeignKey('ProjectIdea', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)]) # 1 to 5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at'] # Show newest reviews first

    def __str__(self):
        return f"{self.user.username} - {self.rating} Stars"
