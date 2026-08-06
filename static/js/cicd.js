const pipelineSteps = [

    {
        id: "commit",
        title: "Commit",
        description:
            "작성한 소스 코드 변경 사항을 Git 커밋으로 저장합니다.",
        code:
            `Git Commit

변경 사항 저장

Example:

git add .
git commit -m "feature: update application"`
    },


    {
        id: "push",
        title: "Push",
        description:
            "로컬 변경 사항을 원격 저장소로 업로드합니다.",
        code:
            `Git Push

원격 저장소 반영

Example:

git push origin dev`
    },


    {
        id: "pr",
        title: "Pull Request",
        description:
            "코드 리뷰와 병합 검토를 위해 Pull Request를 생성합니다.",
        code:
            `Pull Request

dev branch
    ↓
Code Review
    ↓
Merge to main`
    },


    {
        id: "actions",
        title: "GitHub Actions",
        description:
            "Pull Request 또는 Merge 이벤트를 기준으로 CI Workflow를 실행합니다.",
        code:
            `CI Workflow

Trigger:

Pull Request


Steps:

1. Checkout Source Code

2. Install Dependencies

3. Run Ruff

4. Run Pytest


CI Passed`
    },


    {
        id: "ruff",
        title: "Ruff",
        description:
            "CI Workflow 내부에서 Python 코드 품질 검사를 수행합니다.",
        code:
            `Code Quality Check

Command:

ruff check .

ruff format --check


Purpose:

- Lint 검사
- 코드 스타일 검증`
    },


    {
        id: "pytest",
        title: "Pytest",
        description:
            "CI Workflow 내부에서 자동화 테스트를 수행합니다.",
        code:
            `Automated Test

Command:

pytest tests/


Purpose:

- 기능 검증
- Regression 방지`
    },


    {
        id: "deploy",
        title: "Deploy",
        description:
            "CI 검증 완료 후 운영 환경에 애플리케이션을 배포합니다.",
        code:
            `CD Deployment

Trigger:

Merge main branch


Process:

Build
 ↓
Deploy
 ↓
Health Check`
    },


    {
        id: "production",
        title: "Production",
        description:
            "배포 완료 후 운영 환경에서 서비스를 제공합니다.",
        code:
            `Production Service

Health Check:

GET /health


Response:

{
  "status": "ok"
}`
    }

];

// elements

const startButton =
    document.querySelector("#start-pipeline");


const nodes =
    document.querySelectorAll(".pipeline-node");


const detail =
    document.querySelector("#step-description");


const code =
    document.querySelector("#step-code");



// sleep

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );

}



// reset

function resetPipeline() {

    nodes.forEach(node => {

        node.classList.remove(
            "running",
            "success"
        );

    });

}



// update detail

function updateDetail(step) {

    detail.innerHTML = `
        <strong>${step.title}</strong>
        <br><br>
        ${step.description}
    `;

    code.textContent = step.code;

}



// run pipeline

async function startPipeline() {


    startButton.disabled = true;


    resetPipeline();



    for (const step of pipelineSteps) {


        const node =
            document.querySelector(
                `[data-step="${step.id}"]`
            );


        updateDetail(step);



        node.classList.add(
            "running"
        );


        await sleep(1200);



        node.classList.remove(
            "running"
        );


        node.classList.add(
            "success"
        );


    }


    startButton.disabled = false;


}



// click event

startButton.addEventListener(
    "click",
    startPipeline
);



// node click

nodes.forEach(node => {


    node.addEventListener(
        "click",
        () => {


            const step =
                pipelineSteps.find(
                    item =>
                        item.id === node.dataset.step
                );


            updateDetail(step);


        }
    );


});