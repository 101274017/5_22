"""多租户 Header 拦截依赖"""
from fastapi import Header, HTTPException


def get_tenant_id(
    x_tenant_id: str = Header(..., alias="X-Tenant-ID", description="租户唯一确权标识")
) -> str:
    """从请求头中提取并校验租户 ID"""
    if not x_tenant_id or x_tenant_id.strip() == "":
        raise HTTPException(
            status_code=400,
            detail="Security Error: X-Tenant-ID Header Required.",
        )
    return x_tenant_id.strip()
