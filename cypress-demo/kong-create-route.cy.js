/**
 * Kong 3.12 企业版 Route 创建测试用例
 * 功能：创建 Service → 创建 Route → 验证配置 → 强制清理资源
 * 优化点：移除转发验证、修复资源清理不彻底问题、增加强制删除逻辑
 */
describe('Kong: 基于 Service 创建 Route 完整测试用例', () => {
  // 核心配置（可根据环境调整）
  const config = {
    kongAdminUrl: 'http://localhost:8001',
    serviceName: 'cypress-test-service',
    routeName: 'cypress-test-route',
    backend: {
      protocol: 'http',
      host: 'httpbin.org',
      port: 80
    },
    route: {
      paths: ['/cypress-test-api/*'], 
      methods: ['GET', 'POST'],
      stripPath: true
    }
  };

  // 前置操作：清理残留资源 + 创建基础 Service
  before(() => {
    cy.log('=== 前置操作：强制清理所有残留资源 ===');
    // 强制删除 Route（先删 Route 避免级联删除问题）
    cy.request({
      method: 'DELETE',
      url: `${config.kongAdminUrl}/routes/${config.routeName}`,
      failOnStatusCode: false
    }).then(res => {
      res.status === 204 ? cy.log(`已删除残留 Route: ${config.routeName}`) : cy.log('无残留 Route 需要删除');
    });

    // 强制删除 Service
    cy.request({
      method: 'DELETE',
      url: `${config.kongAdminUrl}/services/${config.serviceName}`,
      failOnStatusCode: false
    }).then(res => {
      res.status === 204 ? cy.log(`已删除残留 Service: ${config.serviceName}`) : cy.log('无残留 Service 需要删除');
    });

    cy.log('=== 前置操作：创建基础 Service ===');
    // 创建 Service（Kong 3.12 兼容格式）
    cy.request({
      method: 'POST',
      url: `${config.kongAdminUrl}/services`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: config.serviceName,
        protocol: config.backend.protocol,
        host: config.backend.host,
        port: config.backend.port
      }
    }).then(res => {
      cy.log(`Service 创建成功，ID: ${res.body.id}`);
      Cypress.env('SERVICE_ID', res.body.id); 
      Cypress.env('SERVICE_NAME', config.serviceName); // 保存名称供清理使用
      Cypress.env('ROUTE_NAME', config.routeName);     // 保存名称供清理使用
    });
  });

  // 测试1：创建 Route（关联已创建的 Service）
  it('1. 成功创建关联 Service 的 Route', () => {
    cy.log('=== 开始创建 Route ===');
    cy.request({
      method: 'POST',
      url: `${config.kongAdminUrl}/services/${config.serviceName}/routes`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: config.routeName,
        paths: config.route.paths,
        methods: config.route.methods,
        strip_path: config.route.stripPath
      }
    }).then(response => {
      // 核心断言（适配 Kong 3.12 响应结构）
      expect(response.status).to.eq(201, 'Route 创建失败，状态码非 201');
      expect(response.body.name).to.eq(config.routeName, 'Route 名称不匹配');
      expect(response.body.paths).to.include(config.route.paths[0], 'Route 路径配置不匹配');
      expect(response.body.methods).to.include.members(config.route.methods, 'Route 方法配置不匹配');
      expect(response.body.strip_path).to.eq(config.route.stripPath, 'strip_path 配置不匹配');
      expect(response.body.service.id).to.eq(Cypress.env('SERVICE_ID'), 'Route 关联的 Service ID 不匹配');

      cy.log('Route 创建成功，响应详情：', JSON.stringify(response.body));
    });
  });

  // 测试2：验证 Route 配置和关联关系
  it('2. 验证 Route 已存在且配置正确', () => {
    cy.log('=== 验证 Route 配置 ===');
    cy.request({
      method: 'GET',
      url: `${config.kongAdminUrl}/routes/${config.routeName}`
    }).then(response => {
      expect(response.status).to.eq(200, 'Route 不存在，返回 404');
      // 二次验证核心配置
      expect(response.body.paths).to.include(config.route.paths[0]);
      expect(response.body.service.id).to.eq(Cypress.env('SERVICE_ID'));
      cy.log('Route 配置验证通过');
    });
  });

  // 后置操作：强制清理所有测试资源（解决UI残留问题）
  after(() => {
    cy.log('=== 后置操作：强制清理测试资源 ===');
    // 步骤1：先强制删除 Route（避免级联删除延迟）
    cy.request({
      method: 'DELETE',
      url: `${config.kongAdminUrl}/routes/${Cypress.env('ROUTE_NAME')}`,
      failOnStatusCode: false,
      timeout: 10000 // 延长超时时间
    }).then(res => {
      if (res.status === 204) {
        cy.log(`✅ 已强制删除 Route: ${Cypress.env('ROUTE_NAME')}`);
      } else {
        cy.log(`⚠️ Route 删除失败，尝试通过 ID 删除...`);
        // 兜底：通过名称查询 Route ID 再删除
        cy.request({
          method: 'GET',
          url: `${config.kongAdminUrl}/routes`,
          failOnStatusCode: false
        }).then(routesRes => {
          const targetRoute = routesRes.body.data.find(route => route.name === Cypress.env('ROUTE_NAME'));
          if (targetRoute) {
            cy.request({
              method: 'DELETE',
              url: `${config.kongAdminUrl}/routes/${targetRoute.id}`,
              failOnStatusCode: false
            }).then(res => {
              res.status === 204 ? cy.log(`✅ 通过 ID 删除 Route 成功`) : cy.log(`❌ Route 删除失败`);
            });
          }
        });
      }
    });

    // 步骤2：再强制删除 Service
    cy.request({
      method: 'DELETE',
      url: `${config.kongAdminUrl}/services/${Cypress.env('SERVICE_NAME')}`,
      failOnStatusCode: false,
      timeout: 10000 // 延长超时时间
    }).then(res => {
      if (res.status === 204) {
        cy.log(`✅ 已强制删除 Service: ${Cypress.env('SERVICE_NAME')}`);
      } else {
        cy.log(`⚠️ Service 删除失败，尝试通过 ID 删除...`);
        // 兜底：通过名称查询 Service ID 再删除
        cy.request({
          method: 'GET',
          url: `${config.kongAdminUrl}/services`,
          failOnStatusCode: false
        }).then(servicesRes => {
          const targetService = servicesRes.body.data.find(service => service.name === Cypress.env('SERVICE_NAME'));
          if (targetService) {
            cy.request({
              method: 'DELETE',
              url: `${config.kongAdminUrl}/services/${targetService.id}`,
              failOnStatusCode: false
            }).then(res => {
              res.status === 204 ? cy.log(`✅ 通过 ID 删除 Service 成功`) : cy.log(`❌ Service 删除失败`);
            });
          }
        });
      }
    });

    // 步骤3：最终验证清理结果
    cy.wait(1000); // 等待 Kong 同步
    cy.request({
      method: 'GET',
      url: `${config.kongAdminUrl}/services/${Cypress.env('SERVICE_NAME')}`,
      failOnStatusCode: false
    }).then(res => {
      if (res.status === 404) {
        cy.log(`✅ 最终验证：Service 已彻底删除`);
      } else {
        cy.log(`❌ 最终验证：Service 仍残留，请手动删除`);
      }
    });
    cy.request({
      method: 'GET',
      url: `${config.kongAdminUrl}/routes/${Cypress.env('ROUTE_NAME')}`,
      failOnStatusCode: false
    }).then(res => {
      if (res.status === 404) {
        cy.log(`✅ 最终验证：Route 已彻底删除`);
      } else {
        cy.log(`❌ 最终验证：Route 仍残留，请手动删除`);
      }
    });
  });
});