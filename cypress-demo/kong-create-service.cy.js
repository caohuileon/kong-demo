// cypress/e2e/kong-create-service.cy.js
describe('Kong: 创建 Service 测试用例', () => {
  // 配置 Kong Admin 地址和 Service 名称
  const KONG_ADMIN_URL = 'http://localhost:8001';
  const SERVICE_NAME = 'cypress-test-service';
  const BACKEND_PROTOCOL = 'http';
  const BACKEND_HOST = 'httpbin.org';
  const BACKEND_PORT = 80;

  // 步骤1：创建 Kong Service（修复响应断言）
  it('成功创建 Kong Service', () => {
    cy.request({
      method: 'POST',
      url: `${KONG_ADMIN_URL}/services`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: SERVICE_NAME,
        // 改用拆分字段配置（Kong 推荐，避免 url 解析问题）
        protocol: BACKEND_PROTOCOL,
        host: BACKEND_HOST,
        port: BACKEND_PORT
      }
    }).then((response) => {
      // 1. 先打印完整响应（调试用，可选）
      cy.log('Kong 创建 Service 响应：', JSON.stringify(response.body));

      // 2. 核心断言（适配 Kong 响应结构）
      expect(response.status).to.eq(201); // 创建成功状态码
      expect(response.body.name).to.eq(SERVICE_NAME);
      // 断言拆分的字段（而非 url）
      expect(response.body.protocol).to.eq(BACKEND_PROTOCOL);
      expect(response.body.host).to.eq(BACKEND_HOST);
      expect(response.body.port).to.eq(BACKEND_PORT);
      // 若仍想断言完整 url，可拼接字段验证
      const fullUrl = `${response.body.protocol}://${response.body.host}:${response.body.port}`;
      expect(fullUrl).to.eq('http://httpbin.org:80');
    });
  });

  // 步骤2：验证 Service 已存在
  it('验证 Service 已存在', () => {
    cy.request({
      method: 'GET',
      url: `${KONG_ADMIN_URL}/services/${SERVICE_NAME}`
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.name).to.eq(SERVICE_NAME);
    });
  });

  // 步骤3：清理资源（测试后删除）
  after(() => {
    cy.request({
      method: 'DELETE',
      url: `${KONG_ADMIN_URL}/services/${SERVICE_NAME}`,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 204) {
        cy.log(`已删除 Service: ${SERVICE_NAME}`);
      }
    });
  });
});
