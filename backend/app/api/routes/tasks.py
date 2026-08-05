from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_task_or_404
from app.db.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
async def list_tasks(db: AsyncSession = Depends(get_db)) -> list[Task]:
    # Open tasks before done ones; within each, soonest due date first with
    # undated tasks sorted last, then oldest-created first as a tiebreaker.
    result = await db.execute(
        select(Task).order_by(Task.is_done, Task.due_date.is_(None), Task.due_date, Task.created_at)
    )
    return list(result.scalars().all())


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)) -> Task:
    task = Task(**payload.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task: Task = Depends(get_task_or_404)) -> Task:
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    payload: TaskUpdate, task: Task = Depends(get_task_or_404), db: AsyncSession = Depends(get_db)
) -> Task:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task: Task = Depends(get_task_or_404), db: AsyncSession = Depends(get_db)) -> None:
    await db.delete(task)
    await db.commit()
