from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from myapp.Serializers.Project_Idea import ProjectIdeaSerializer

from myapp.Models.Project_Idea import ProjectIdea, ProjectReview, ProjectCloneLog
from myapp.Models.Kit_Builder import SavedKit, KitItem

from django.utils import timezone



# Project Rpresentation Logic
class ProjectIdeaListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ideas = ProjectIdea.objects.all().order_by('-id')
        serializer = ProjectIdeaSerializer(ideas, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectIdeaSerializer(data=request.data)
        if serializer.is_valid():
            # Grab the real username of the person publishing!
            student_name = request.user.username if request.user.is_authenticated else "Anonymous Maker"
            serializer.save(student_name=student_name)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        # Print the error in python terminal to check if it fails or not
        print("PUBLISH ERROR:", serializer.errors) 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Cloning Logic
class CloneProjectView(APIView):
    permission_classes = [IsAuthenticated] # Must be logged in to clone!

    def post(self, request, pk):
        try:
            project = ProjectIdea.objects.get(id=pk)
        except ProjectIdea.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Check daily limit (max 2 per day)
        today = timezone.now().date()
        clone_count = ProjectCloneLog.objects.filter(
            user=request.user, 
            cloned_at__date=today
        ).count()

        if clone_count >= 2:
            return Response({
                "error": "Daily limit reached. You can only clone 2 projects per day."
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Increment master clone count
        project.clones += 1
        project.save()

        # 3. Create a new Workspace/Kit for the user
        new_kit = SavedKit.objects.create(
            user=request.user,
            kit_name=f"Clone: {project.title}",
            description=project.description  # Copies their documentation too!
        )

        # 4. Copy all hardware components into the new Kit
        for product in project.components.all():
            KitItem.objects.create(kit=new_kit, product=product, quantity=1)

        # 5. Log the action so they can't spam it
        ProjectCloneLog.objects.create(user=request.user, project=project)

        return Response({
            "message": f"Success! '{project.title}' has been cloned to your Smart Kit Builder.", 
            "clones": project.clones
        }, status=status.HTTP_200_OK)


# Review Logic
class AddProjectReviewView(APIView):
    permission_classes = [IsAuthenticated] # Must be logged in to leave a review!

    def post(self, request, pk):
        try:
            project = ProjectIdea.objects.get(id=pk)
        except ProjectIdea.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        rating = request.data.get('rating')
        comment = request.data.get('comment')

        if not rating or not comment:
            return Response({"error": "Both rating and comment are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the review
        review = ProjectReview.objects.create(
            project=project,
            user=request.user,
            rating=int(rating),
            comment=comment
        )

        # Return the newly created review so React can instantly show it
        return Response({
            "message": "Review added successfully!",
            "review": {
                "id": review.id,
                "user": request.user.username,
                "rating": review.rating,
                "comment": review.comment,
                "date": review.created_at.strftime("%b %d, %Y")
            }
        }, status=status.HTTP_201_CREATED)
    
