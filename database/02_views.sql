-- Views initialization file
-- Recommendation: include `USE c_p_sunat;` at top if needed
-- Define views that depend on tables created earlier in 01 schema

-- Example:
-- DROP VIEW IF EXISTS v_roles_select;
-- CREATE VIEW v_roles_select AS
-- SELECT ID_ROLE, NAME FROM entity_role WHERE STATE = 1 AND ID_ROLE IN (3,4);
DROP VIEW IF EXISTS v_roles;
CREATE VIEW v_roles_select AS
SELECT 
    ID_ROLE, 
    NAME 
FROM entity_role 
WHERE STATE = 1 AND ID_ROLE IN (3,4)
ORDER BY ID_ROLE ASC;

DROP VIEW IF EXISTS v_coins;
CREATE VIEW v_coins AS
SELECT 
    ID_COIN,
    ISO, 
    NAME, 
    SIMBOL, 
    COUNTRY, 
    STATE
FROM coin
WHERE STATE = 1;


DROP VIEW IF EXISTS v_data_select;
CREATE VIEW v_data_select AS
SELECT
    p.ID_PROJECT,
    p.NAME AS NAME_PROJECT,
    l.ID_LOCATION,
    l.NAME AS NAME_LOCATION,
    en.ID_NATURAL,
    CONCAT(en.NAME, ' ', en.LAST_NAME) AS NAME_RESPONSABLE,
    p.ID_USER

FROM project AS p
JOIN location AS l ON l.ID_PROJECT = p.ID_PROJECT
JOIN entity_natural AS en ON en.ID_NATURAL = p.ID_NATURAL
WHERE p.STATE = 1
    AND l.STATE = 1
    AND en.STATE = 1;
