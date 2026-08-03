const pipelineSteps = [

    {
        id: "commit",
        title: "Commit",
        description:
            "Developer creates a snapshot of source code changes.",
        code:
            `git add .

git commit -m "feat: add health endpoint"`
    },

    {
        id: "push",
        title: "Push",
        description:
            "Source code is pushed to remote repository.",
        code:
            `git push origin main`
    },

    {
        id: "pr",
        title: "Pull Request",
        description:
            "A Pull Request is created for code review.",
        code:
            `Create Pull Request

main ← feature branch`
    },

    {
        id: "actions",
        title: "GitHub Actions",
        description:
            "CI workflow starts automatically.",
        code:
            `name: CI

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest`
    },

    {
        id: "ruff",
        title: "Ruff",
        description:
            "Static analysis and code quality check.",
        code:
            `ruff check .`
    },

    {
        id: "pytest",
        title: "Pytest",
        description:
            "Automated tests are executed.",
        code:
            `pytest tests/`
    },

    {
        id: "deploy",
        title: "Deploy",
        description:
            "Application is deployed to production.",
        code:
            `Render Deployment

Build → Deploy`
    },

    {
        id: "production",
        title: "Production",
        description:
            "Live service is running.",
        code:
            `GET /health

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