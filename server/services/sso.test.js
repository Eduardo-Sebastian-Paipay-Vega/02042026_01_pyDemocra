import { processSamlAssertion, mapEnterpriseAttributesToRbac } from "./sso-saml.js";

describe("Modulo M10: SSO SAML 2.0 y Mapeo RBAC (server/services/sso-saml.js)", () => {
  const samlXmlSample = `
  <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
    <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
      <saml:Subject>
        <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">coordinador.corporativo@empresa.com</saml:NameID>
      </saml:Subject>
      <saml:AttributeStatement>
        <saml:Attribute Name="email">
          <saml:AttributeValue>coordinador.corporativo@empresa.com</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="groups">
          <saml:AttributeValue>GRP_COORD_VOLUNTEERS</saml:AttributeValue>
        </saml:Attribute>
      </saml:AttributeStatement>
    </saml:Assertion>
  </samlp:Response>`;

  test("procesa asercion SAML 2.0 extrayendo NameID y grupos", () => {
    const res = processSamlAssertion({ xmlAssertion: samlXmlSample });

    expect(res.valid).toBe(true);
    expect(res.email).toBe("coordinador.corporativo@empresa.com");
    expect(res.groups).toContain("GRP_COORD_VOLUNTEERS");
  });

  test("mapea atributos corporativos SSO a rol COORDINADOR con sus permisos RBAC", () => {
    const samlRes = processSamlAssertion({ xmlAssertion: samlXmlSample });
    const userProfile = mapEnterpriseAttributesToRbac(samlRes);

    expect(userProfile.email).toBe("coordinador.corporativo@empresa.com");
    expect(userProfile.rbac.role).toBe("COORDINADOR");
    expect(userProfile.rbac.permissions).toContain("EVALUATE_VOLUNTEERS");
  });

  test("lanza error si la asercion XML no contiene email", () => {
    expect(() =>
      processSamlAssertion({ xmlAssertion: "<invalid>no email</invalid>" })
    ).toThrow("No se pudo extraer un correo electrónico válido de la aserción SAML.");
  });
});
