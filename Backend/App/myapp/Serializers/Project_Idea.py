from rest_framework import serializers

from myapp.Models.Product_Explorer import Product
from myapp.Models.Project_Idea import ProjectIdea, ProjectReview



# Review Logic
class ProjectReviewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    
    date = serializers.SerializerMethodField()

    class Meta:
        model = ProjectReview
        fields = ['id', 'user', 'rating', 'comment', 'date']

    def get_date(self, obj):
        return obj.created_at.strftime("%b %d, %Y")


# Project Representation Logic
class ProjectIdeaSerializer(serializers.ModelSerializer):
    studentName = serializers.CharField(source='student_name', read_only=True)
    techStack = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    image = serializers.URLField(source='image_url', read_only=True)
    
    reviews = ProjectReviewSerializer(many=True, read_only=True) 

    component_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='components',
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = ProjectIdea
        fields = [
            'id', 'title', 'studentName', 'university', 'date', 
            'description', 'techStack', 'image', 'category', 'difficulty', 'clones',
            'tags', 'component_ids', 'reviews' 
        ]
    
    def get_techStack(self, obj):
        return [comp.name for comp in obj.components.all()]
        
    def get_date(self, obj):
        return "Oct 2025"
