# 🌐 用户自定义子域名配置指南

## 问题分析
用户自定义子域名 `shuaihao.real-timesalary.wanderhubt.com` 无法访问的根本原因：

1. **DNS配置不完整** - 需要通配符DNS记录
2. **SSL证书缺失** - 需要通配符SSL证书
3. **Vercel配置不当** - 需要支持动态子域名

## 🔧 完整解决方案

### 第1步：CloudFlare DNS配置

在CloudFlare DNS管理中添加**通配符记录**：

```dns
类型: CNAME
名称: *.real-timesalary
内容: real-timesalary.wanderhubt.com
代理状态: 仅DNS (灰色云朵) 
```

或者直接指向Vercel：
```dns
类型: CNAME  
名称: *.real-timesalary
内容: cname.vercel-dns.com
代理状态: 仅DNS (灰色云朵)
```

### 第2步：Vercel项目配置

#### 2.1 在Vercel控制台添加通配符域名
1. 进入项目 → Settings → Domains
2. 添加域名：`*.real-timesalary.wanderhubt.com`
3. Vercel会自动申请通配符SSL证书

#### 2.2 验证域名所有权
Vercel会要求验证域名所有权，通常需要在DNS中添加TXT记录。

### 第3步：SSL证书配置

**方案A：Let's Encrypt通配符证书（推荐）**
- Vercel会自动申请 `*.real-timesalary.wanderhubt.com` 的SSL证书
- 无需手动操作，等待5-15分钟生效

**方案B：CloudFlare SSL（备选）**
- 在CloudFlare开启"Full (strict)"SSL模式
- 设置子域名代理状态为"仅DNS"

### 第4步：测试验证

```bash
# 测试DNS解析
nslookup testuser.real-timesalary.wanderhubt.com

# 测试HTTPS连接  
curl -I https://testuser.real-timesalary.wanderhubt.com

# 测试实际页面
curl -L https://shuaihao.real-timesalary.wanderhubt.com
```

## 🎯 技术架构说明

### 动态子域名路由原理：

1. **DNS层**：`*.real-timesalary.wanderhubt.com` → Vercel IP
2. **SSL层**：通配符证书覆盖所有子域名  
3. **应用层**：Next.js middleware解析子域名并路由到正确的用户数据

```typescript
// middleware.ts 已经正确实现
export function middleware(request: NextRequest) {
  const subdomain = getSubdomain(request.nextUrl.host)
  if (subdomain) {
    // 将子域名信息传递给页面
    const url = request.nextUrl.clone()
    url.searchParams.set('subdomain', subdomain)
    return NextResponse.rewrite(url)
  }
}
```

### 用户体验流程：

1. 用户访问 `https://shuaihao.real-timesalary.wanderhubt.com`
2. DNS解析到Vercel服务器
3. SSL握手成功（通配符证书）
4. Next.js middleware提取子域名 `shuaihao`
5. 页面根据子域名加载对应用户数据
6. 显示个性化的工资计算界面

## ⚠️ 常见问题排除

### 问题1：SSL_CERTIFICATE错误
```
原因：通配符SSL证书未配置
解决：在Vercel添加 *.real-timesalary.wanderhubt.com
```

### 问题2：DNS_RESOLUTION错误  
```
原因：通配符DNS记录缺失
解决：在CloudFlare添加 CNAME *.real-timesalary
```

### 问题3：子域名404错误
```
原因：middleware路由配置问题
解决：检查middleware.ts中的域名匹配逻辑
```

## 🚀 部署清单

- [ ] CloudFlare添加通配符DNS记录
- [ ] Vercel添加通配符域名  
- [ ] 等待SSL证书自动申请
- [ ] 测试多个子域名访问
- [ ] 验证TDD错误处理系统

完成以上步骤后，用户就可以使用任意子域名如：
- `https://john.real-timesalary.wanderhubt.com`
- `https://alice.real-timesalary.wanderhubt.com`  
- `https://任意用户名.real-timesalary.wanderhubt.com`

系统会自动为每个用户创建独立的子域名空间！