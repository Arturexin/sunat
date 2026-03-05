DROP PROCEDURE IF EXISTS sp_list_responsable;
DELIMITER $$
CREATE PROCEDURE sp_list_responsable(
    IN p_id_user BIGINT
)
BEGIN 
    SELECT
        en.ID_NATURAL,
        CONCAT(en.LAST_NAME, ', ', en.NAME) AS FULL_NAME
    FROM entity AS e
    JOIN entity_natural AS en ON en.ID_ENTITY = e.ID_ENTITY
    WHERE e.ID_USER = p_id_user
        AND e.STATE = 1
        AND en.STATE = 1
    ORDER BY en.LAST_NAME ASC, en.NAME ASC;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_list_employees;
DELIMITER $$
CREATE PROCEDURE sp_list_employees(
    IN p_id_user BIGINT,
    IN p_state TINYINT
)
BEGIN
    SELECT 
            en.ID_NATURAL,
            en.NAME, 
            en.LAST_NAME,
            ed.NUMBER_DOCUMENT,
            er.NAME AS ROLE,
            er.ID_ROLE,
            ep.NUMBER_MOVIL,
            e.DATE_RECORD
    FROM entity AS e
    JOIN entity_natural AS en ON en.ID_ENTITY = e.ID_ENTITY
    JOIN entity_role AS er ON er.ID_ROLE = e.ID_ROLE
    JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
    JOIN entity_phone AS ep ON ep.ID_PHONE = e.ID_PHONE
    JOIN users AS u ON u.ID_USER = e.ID_USER
    WHERE e.STATE = p_state AND u.ID_USER = p_id_user;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_employee;
DELIMITER $$
CREATE PROCEDURE sp_create_employee(
    IN p_name VARCHAR(30),
    IN p_last_name VARCHAR(70),
    IN p_number_document VARCHAR(20),
    IN p_number_phone VARCHAR(20),
    IN p_number_movil VARCHAR(20),
    IN p_id_role INT,
    IN p_id_type_document TINYINT,
    IN p_code_area VARCHAR(10),
    IN p_id_user BIGINT,
    IN p_address BIGINT,
    IN p_genero TINYINT,
    IN p_state TINYINT
)
BEGIN
    DECLARE v_id_document BIGINT;
    DECLARE v_id_phone BIGINT;
    DECLARE v_id_entity BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO entity_document (ID_TYPE_DOCUMENT, NUMBER_DOCUMENT, STATE)
    VALUES (p_id_type_document, p_number_document, p_state);
    SET v_id_document = LAST_INSERT_ID();

    INSERT INTO entity_phone (NUMBER_PHONE, NUMBER_MOVIL, CODE_AREA, STATE)
    VALUES (p_number_phone, p_number_movil, p_code_area, p_state);
    SET v_id_phone = LAST_INSERT_ID();

    INSERT INTO entity (ID_DOCUMENT, ID_PHONE, ID_ADDRESS, ID_USER, ID_ROLE, STATE, DATE_RECORD)
    VALUES (v_id_document, v_id_phone, p_address, p_id_user, p_id_role, p_state, NOW());
    SET v_id_entity = LAST_INSERT_ID();

    INSERT INTO entity_natural (ID_ENTITY, NAME, LAST_NAME, GENERO, STATE, DATE_BIRTH)
    VALUES (v_id_entity, p_name, p_last_name, p_genero, p_state, NOW());
    COMMIT;

    SELECT 
            en.ID_NATURAL,
            en.NAME, 
            en.LAST_NAME,
            ed.NUMBER_DOCUMENT,
            er.NAME AS ROLE,
            er.ID_ROLE,
            ep.NUMBER_MOVIL,
            e.DATE_RECORD
    FROM entity AS e
    JOIN entity_natural AS en ON en.ID_ENTITY = e.ID_ENTITY
    JOIN entity_role AS er ON er.ID_ROLE = e.ID_ROLE
    JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
    JOIN entity_phone AS ep ON ep.ID_PHONE = e.ID_PHONE
    JOIN users AS u ON u.ID_USER = e.ID_USER
    WHERE e.STATE = p_state AND en.ID_ENTITY = v_id_entity AND u.ID_USER = p_id_user;
END $$
DELIMITER ;

-- Actualización de colaboradores (persona natural)
DROP PROCEDURE IF EXISTS sp_update_employee;
DELIMITER $$
CREATE PROCEDURE sp_update_employee(
    IN p_id_natural BIGINT,
    IN p_id_user BIGINT,
    IN p_name VARCHAR(30),
    IN p_last_name VARCHAR(70),
    IN p_number_document VARCHAR(20),
    IN p_number_movil VARCHAR(20),
    IN p_id_role INT
)
BEGIN 
    DECLARE v_id_entity BIGINT;
    DECLARE v_id_document BIGINT;
    DECLARE v_id_phone BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT e.ID_ENTITY, e.ID_DOCUMENT, e.ID_PHONE
        INTO v_id_entity, v_id_document, v_id_phone
        FROM entity_natural en
        JOIN entity e ON e.ID_ENTITY = en.ID_ENTITY
    WHERE en.ID_NATURAL = p_id_natural
        AND e.ID_USER = p_id_user
        AND e.STATE = 1
    LIMIT 1;

    START TRANSACTION;

    UPDATE entity_natural
        SET NAME = IFNULL(p_name, NAME),
            LAST_NAME = IFNULL(p_last_name, LAST_NAME)
    WHERE ID_NATURAL = p_id_natural
        AND STATE = 1;

    IF v_id_document IS NOT NULL THEN
        UPDATE entity_document
            SET NUMBER_DOCUMENT = IFNULL(p_number_document, NUMBER_DOCUMENT)
        WHERE ID_DOCUMENT = v_id_document
            AND STATE = 1;
    END IF;

    IF v_id_phone IS NOT NULL THEN
        UPDATE entity_phone
            SET NUMBER_MOVIL = IFNULL(p_number_movil, NUMBER_MOVIL)
        WHERE ID_PHONE = v_id_phone
            AND STATE = 1;
    END IF;

    UPDATE entity
        SET ID_ROLE = IFNULL(p_id_role, ID_ROLE)
    WHERE ID_ENTITY = v_id_entity
        AND ID_USER = p_id_user
        AND STATE = 1;
    
    COMMIT;

    SELECT 
            en.ID_NATURAL,
            en.NAME,
            en.LAST_NAME,
            ed.NUMBER_DOCUMENT,
            er.NAME AS ROLE,
            er.ID_ROLE,
            e.DATE_RECORD
    FROM entity AS e
    JOIN entity_natural AS en ON en.ID_ENTITY = e.ID_ENTITY
    JOIN entity_role AS er ON er.ID_ROLE = e.ID_ROLE
    JOIN entity_document AS ed ON ed.ID_DOCUMENT = e.ID_DOCUMENT
    JOIN entity_phone AS ep ON ep.ID_PHONE = e.ID_PHONE
    JOIN users AS u ON u.ID_USER = e.ID_USER
    WHERE e.STATE = 1
        AND en.ID_NATURAL = p_id_natural
        AND u.ID_USER = p_id_user;
END $$
DELIMITER ;

-- Eliminación de colaboradores (persona natural)
DROP PROCEDURE IF EXISTS sp_delete_employee;
DELIMITER $$ ;
CREATE PROCEDURE sp_delete_employee(
    IN p_id_natural BIGINT,
    IN p_id_user BIGINT
)
BEGIN 
    DECLARE v_id_entity BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT e.ID_ENTITY
        INTO v_id_entity
        from entity_natural en
        join entity e ON e.ID_ENTITY = en.ID_ENTITY
    WHERE en.ID_NATURAL = p_id_natural
        AND e.ID_USER = p_id_user
        AND e.STATE = 1
    LIMIT 1;
    START TRANSACTION;

    UPDATE entity 
        SET STATE = 0
    WHERE ID_ENTITY = v_id_entity
        AND ID_USER = p_id_user
        AND STATE = 1;
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Colaborador no encontrado o ya inactivo';
    END IF;
    
    COMMIT;
    SELECT ROW_COUNT() AS affected;
END $$
DELIMITER ;