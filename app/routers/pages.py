from fastapi import APIRouter, HTTPException, Request
from fastapi.templating import Jinja2Templates

from app.career_catalog import CAREER_PROJECTS, career_project_list
from app.project_catalog import PERSONAL_PROJECTS, personal_project_list

router = APIRouter()
templates = Jinja2Templates(directory="templates")


def render_page(request: Request, template_name: str):
    return templates.TemplateResponse(
        request=request,
        name=template_name,
        context={},
    )


@router.get("/about")
def about(request: Request):
    return render_page(request, "pages/about.html")


@router.get("/projects")
def projects(request: Request):
    return render_page(request, "pages/projects/index.html")


@router.get("/projects/career")
def career_projects(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="pages/projects/career.html",
        context={"projects": career_project_list()},
    )


@router.get("/projects/career/{slug}")
def career_project_detail(slug: str, request: Request):
    project = CAREER_PROJECTS.get(slug)
    if project is None:
        raise HTTPException(status_code=404, detail="Career project not found")
    return templates.TemplateResponse(
        request=request,
        name="pages/projects/career-detail.html",
        context={"project": project, "slug": slug},
    )


@router.get("/projects/personal")
def personal_projects(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="pages/projects/personal.html",
        context={"projects": personal_project_list()},
    )


@router.get("/projects/personal/{slug}")
def personal_project_detail(slug: str, request: Request):
    project = PERSONAL_PROJECTS.get(slug)
    if project is None:
        raise HTTPException(status_code=404, detail="Personal project not found")
    return templates.TemplateResponse(
        request=request,
        name="pages/projects/personal-detail.html",
        context={"project": project, "slug": slug},
    )


@router.get("/labs")
def labs(request: Request):
    return render_page(request, "pages/labs.html")


@router.get("/contact")
def contact(request: Request):
    return render_page(request, "pages/contact.html")
