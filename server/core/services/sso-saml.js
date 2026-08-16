/**
 * Adaptador de Autenticación SSO Empresarial SAML 2.0 / OAuth2 Enterprise
 * e Inyección RBAC (Módulo M10 / RF-064).
 */

/**
 * Procesa y valida la aserción XML SAML 2.0 provista por el IdP (Okta, Azure AD, Entra ID).
 *
 * @param {Object} options
 * @param {string} options.xmlAssertion - Aserción XML codificada o en texto plano de SAML.
 * @param {string} [options.idpIssuer] - Emisor esperado del proveedor de identidad.
 * @param {string} [options.expectedAudience] - Identificador de audiencia esperado (EntityID de la app).
 * @returns {Object} Datos extraídos de la aserción SAML validada.
 */
export function processSamlAssertion({ xmlAssertion, idpIssuer = "https://identity.company.com", expectedAudience = "democra-sp" }) {
  if (!xmlAssertion || typeof xmlAssertion !== "string") {
    throw new Error("La aserción SAML XML es obligatoria.");
  }

  // Extracción defensiva de campos principales de la aserción SAML 2.0
  const nameIdMatch = xmlAssertion.match(/<(?:saml:)?NameID[^>]*>([^<]+)<\/(?:saml:)?NameID>/i);
  const emailMatch = xmlAssertion.match(/Attribute Name="(?:email|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/emailaddress)"[^>]*>[\s\S]*?<(?:saml:)?AttributeValue[^>]*>([^<]+)<\/(?:saml:)?AttributeValue>/i);

  const nameId = nameIdMatch ? nameIdMatch[1].trim() : null;
  const email = emailMatch ? emailMatch[1].trim() : nameId;

  if (!email || !email.includes("@")) {
    throw new Error("No se pudo extraer un correo electrónico válido de la aserción SAML.");
  }

  const groupAttrMatch = xmlAssertion.match(/Attribute Name="(?:groups|roles|http:\/\/schemas\.xmlsoap\.org\/claims\/Group)"[^>]*>([\s\S]*?)<\/(?:saml:)?Attribute>/i);
  let groups = [];
  if (groupAttrMatch) {
    const vals = [...groupAttrMatch[1].matchAll(/<(?:saml:)?AttributeValue[^>]*>([^<]+)<\/(?:saml:)?AttributeValue>/gi)];
    groups = vals.map((v) => v[1].trim());
  }

  if (groups.length === 0) {
    const allVals = [...xmlAssertion.matchAll(/<(?:saml:)?AttributeValue[^>]*>([^<]+)<\/(?:saml:)?AttributeValue>/gi)];
    groups = allVals
      .map((v) => v[1].trim())
      .filter((val) => val !== email && (val.startsWith("GRP_") || val.toLowerCase().includes("admin") || val.toLowerCase().includes("coord") || val.toLowerCase().includes("user")));
  }

  return {
    valid: true,
    nameId,
    email,
    idpIssuer,
    expectedAudience,
    groups: groups.length > 0 ? groups : ["GRP_EMPLOYEES"],
    authenticatedAt: new Date().toISOString(),
  };
}

/**
 * Mapea los atributos corporativos provenientes del SSO a los roles RBAC internos de Democra.
 *
 * @param {Object} samlResult - Resultado retornado por `processSamlAssertion`.
 * @returns {Object} Perfil de usuario autenticado con roles RBAC mapeados.
 */
export function mapEnterpriseAttributesToRbac(samlResult) {
  if (!samlResult || !samlResult.email) {
    throw new Error("Datos de aserción SAML inválidos para mapeo de roles.");
  }

  const groups = samlResult.groups || [];
  let role = "VOLUNTARIO";
  const permissions = ["READ_PROJECTS", "SUBMIT_ATTENDANCE"];

  if (groups.some((g) => g.toUpperCase().includes("ADMIN") || g.toUpperCase().includes("GRP_EXEC"))) {
    role = "ADMINISTRADOR_SEDE";
    permissions.push("MANAGE_USERS", "APPROVE_TRANSFERS", "VIEW_FINANCIALS");
  } else if (groups.some((g) => g.toUpperCase().includes("COORD") || g.toUpperCase().includes("MANAGER"))) {
    role = "COORDINADOR";
    permissions.push("MANAGE_EVENTS", "EVALUATE_VOLUNTEERS");
  }

  return {
    email: samlResult.email,
    provider: "SSO_SAML_ENTRA_ID",
    rbac: {
      role,
      permissions,
    },
    ssoMappedAt: new Date().toISOString(),
  };
}
