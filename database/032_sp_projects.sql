DROP PROCEDURE IF EXISTS sp_select_projects;
DELIMITER $$
CREATE PROCEDURE sp_select_projects(
    IN p_id_user BIGINT
)
BEGIN 
    SELECT
        PR.ID_PROJECT,
        PR.NAME
    FROM project AS PR
    WHERE PR.ID_USER = p_id_user
        AND PR.STATE = 1
    ORDER BY PR.NAME ASC, PR.ID_PROJECT;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_list_empresa;
DELIMITER $$
CREATE PROCEDURE sp_list_empresa(
    IN p_id_user BIGINT
)
BEGIN 
    SELECT
        ej.ID_JURIDIC,
        ej.COMPANY_NAME
    FROM entity AS e
    JOIN entity_juridic AS ej ON ej.ID_ENTITY = e.ID_ENTITY
    WHERE e.ID_USER = p_id_user
        AND e.STATE = 1
        AND ej.STATE = 1
    ORDER BY ej.COMPANY_NAME ASC;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_list_projects;
DELIMITER $$
CREATE PROCEDURE sp_list_projects(
    IN p_id_user BIGINT,
    IN p_state TINYINT
)
BEGIN
    SELECT
        p.ID_PROJECT,
        p.NAME,
        pj.ID_JURIDIC,
        ed.NUMBER_DOCUMENT,
        pj.COMPANY_NAME,
        c.ID_COIN,
        c.SIMBOL,
        p.AMOUNT,
        pn.ID_NATURAL,
        pn.NAME AS RESPONSABLE,
        pn.LAST_NAME,
        p.DATE_START,
        p.DATE_END
    FROM project AS p 
    JOIN entity_juridic AS pj ON pj.ID_JURIDIC = p.ID_JURIDIC 
    JOIN entity_natural AS pn ON pn.ID_NATURAL = p.ID_NATURAL 
    JOIN entity AS e ON e.ID_ENTITY = pj.ID_ENTITY
    JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
    JOIN coin AS c ON c.ID_COIN = p.ID_COIN
    WHERE p.ID_USER = p_id_user
        AND p.STATE = p_state
    ORDER BY p.DATE_START DESC;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_create_project;
DELIMITER $$
CREATE PROCEDURE sp_create_project(
    IN p_id_user BIGINT,
    IN p_name VARCHAR(250),
    IN p_id_juridic BIGINT,
    IN p_amount INT,
    IN p_id_natural BIGINT,
    IN p_date_start DATETIME,
    IN p_date_end DATETIME,
    IN p_id_coin INT,
    IN p_state TINYINT
)
BEGIN
    DECLARE v_id_project BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN 
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO project (
        ID_USER,
        NAME,
        ID_JURIDIC,
        AMOUNT,
        ID_NATURAL,
        DATE_START,
        DATE_END,
        ID_COIN,
        STATE
    ) VALUES (
        p_id_user,
        p_name,
        p_id_juridic,
        p_amount,
        p_id_natural,
        p_date_start,
        p_date_end,
        p_id_coin,
        p_state
    );
    SET v_id_project = LAST_INSERT_ID();

    COMMIT;

    SELECT
        p.ID_PROJECT,
        p.NAME,
        pj.ID_JURIDIC,
        ed.NUMBER_DOCUMENT,
        pj.COMPANY_NAME,
        c.ID_COIN,
        c.SIMBOL,
        p.AMOUNT,
        pn.ID_NATURAL,
        pn.NAME AS RESPONSABLE,
        pn.LAST_NAME,
        p.DATE_START,
        p.DATE_END
    FROM project AS p 
    JOIN entity_juridic AS pj ON pj.ID_JURIDIC = p.ID_JURIDIC 
    JOIN entity_natural AS pn ON pn.ID_NATURAL = p.ID_NATURAL 
    JOIN entity AS e ON e.ID_ENTITY = pj.ID_ENTITY
    JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
    JOIN coin AS c ON c.ID_COIN = p.ID_COIN
    WHERE p.ID_PROJECT = v_id_project
        AND p.ID_USER = p_id_user
        AND p.STATE = p_state;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_project;
DELIMITER $$
CREATE PROCEDURE sp_update_project(
    IN p_id_user BIGINT,
    IN p_id_project BIGINT,
    IN p_name VARCHAR(250),
    IN p_id_juridic BIGINT,
    IN p_amount INT,
    IN p_id_natural BIGINT,
    IN p_date_start DATETIME,
    IN p_date_end DATETIME,
    IN p_id_coin INT
)
BEGIN 
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN 
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE project SET
        NAME = p_name,
        ID_JURIDIC = p_id_juridic,
        ID_COIN = p_id_coin,
        AMOUNT = p_amount,
        ID_NATURAL = p_id_natural,
        DATE_START = p_date_start,
        DATE_END = p_date_end
    WHERE ID_PROJECT = p_id_project
        AND ID_USER = p_id_user
        AND STATE = 1;

    COMMIT;

    SELECT
        p.ID_PROJECT,
        p.NAME,
        pj.ID_JURIDIC,
        ed.NUMBER_DOCUMENT,
        pj.COMPANY_NAME,
        c.ID_COIN,
        c.SIMBOL,
        p.AMOUNT,
        pn.ID_NATURAL,
        pn.NAME AS RESPONSABLE,
        pn.LAST_NAME,
        p.DATE_START,
        p.DATE_END
    FROM project AS p 
    JOIN entity_juridic AS pj ON pj.ID_JURIDIC = p.ID_JURIDIC 
    JOIN entity_natural AS pn ON pn.ID_NATURAL = p.ID_NATURAL 
    JOIN entity AS e ON e.ID_ENTITY = pj.ID_ENTITY
    JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
    JOIN coin AS c ON c.ID_COIN = p.ID_COIN
    WHERE p.ID_PROJECT = p_id_project
        AND p.ID_USER = p_id_user
        AND p.STATE = 1;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_delete_project;
DELIMITER $$
CREATE PROCEDURE sp_delete_project(
    IN p_id_user BIGINT,
    IN p_id_project BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    UPDATE project 
        SET STATE = 0
    WHERE ID_PROJECT = p_id_project
        AND ID_USER = p_id_user
        AND STATE = 1;
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Proyecto no encontrado o ya inactivo.';
    END IF;
    
    COMMIT;
    SELECT ROW_COUNT() AS affected;
END $$
DELIMITER ;