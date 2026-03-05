DROP PROCEDURE IF EXISTS sp_select_locations;
DELIMITER $$
CREATE PROCEDURE sp_select_locations(
    IN p_id_user BIGINT
)
BEGIN 
    SELECT
        l.ID_LOCATION,
        l.NAME
    FROM location AS l
    JOIN project AS p ON p.ID_PROJECT = l.ID_PROJECT
    WHERE p.ID_USER = p_id_user
        AND l.STATE = 1
    ORDER BY l.NAME ASC, l.ID_LOCATION;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_list_locations;
DELIMITER $$
CREATE PROCEDURE sp_list_locations(
    IN p_id_user BIGINT,
    IN p_state TINYINT
)
BEGIN 
    SELECT 
        l.ID_LOCATION,
        p.ID_PROJECT,
        p.NAME AS PROJECT, 
        l.NAME, 
        ea.ID_ADDRESS,
        ea.ADDRESS,
        c.ID_COIN,
        c.SIMBOL, 
        l.AMOUNT, 
        l.DATE_START, 
        l.DATE_END
    FROM location AS l
    JOIN project AS p ON p.ID_PROJECT = l.ID_PROJECT
    JOIN entity_address AS ea ON ea.ID_ADDRESS = l.ID_ADDRESS
    JOIN coin AS c ON c.ID_COIN = l.ID_COIN
    WHERE l.STATE = p_state
        AND p.ID_USER = p_id_user
    ORDER BY l.DATE_START DESC;
END $$
DELIMITER ;


DROP PROCEDURE IF EXISTS sp_create_location;
DELIMITER $$
CREATE PROCEDURE sp_create_location(
    IN p_id_user BIGINT,
    IN p_id_project BIGINT,
    IN p_name VARCHAR(250),
    IN p_address VARCHAR(250),
    IN p_amount DECIMAL(10,2),
    IN p_date_start DATETIME,
    IN p_date_end DATETIME,
    IN p_id_coin INT,
    IN p_state TINYINT
)
BEGIN
    DECLARE v_id_location BIGINT;
    DECLARE v_id_address BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO entity_address (ADDRESS, CITY, DEPARTMENT, COUNTRY, UBIGEO, STATE)
    VALUES (p_address, NULL, NULL, NULL, NULL, p_state);
    SET v_id_address = LAST_INSERT_ID();

    INSERT INTO location (ID_PROJECT, NAME, ID_ADDRESS, AMOUNT, DATE_START, DATE_END, ID_COIN, STATE)
    VALUES (p_id_project, p_name, v_id_address, p_amount, p_date_start, p_date_end, p_id_coin, p_state);
    SET v_id_location = LAST_INSERT_ID();

    COMMIT;

    SELECT 
        l.ID_LOCATION,
        l.ID_PROJECT,
        p.NAME AS PROJECT, 
        l.NAME,
        l.ID_ADDRESS, 
        ea.ADDRESS, 
        c.ID_COIN,
        c.SIMBOL,
        l.AMOUNT, 
        l.DATE_START, 
        l.DATE_END
    FROM location AS l
    JOIN project AS p ON p.ID_PROJECT = l.ID_PROJECT
    JOIN entity_address AS ea ON ea.ID_ADDRESS = l.ID_ADDRESS
    JOIN coin AS c ON c.ID_COIN = l.ID_COIN
    WHERE l.ID_LOCATION = v_id_location
        AND l.STATE = p_state
        AND p.ID_USER = p_id_user;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_location;
DELIMITER $$
CREATE PROCEDURE sp_update_location(
    IN p_id_user BIGINT,
    IN p_id_location BIGINT,
    IN p_id_project BIGINT,
    IN p_name VARCHAR(250),
    IN p_id_address BIGINT,
    IN p_address VARCHAR(250),
    IN p_amount DECIMAL(10,2),
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

    UPDATE entity_address SET
        ADDRESS = p_address
    WHERE ID_ADDRESS = p_id_address
        AND STATE = 1;
    
    UPDATE location SET
        ID_PROJECT = p_id_project,
        NAME = p_name,
        AMOUNT = p_amount,
        ID_COIN = p_id_coin,
        DATE_START = p_date_start,
        DATE_END = p_date_end
    WHERE ID_LOCATION = p_id_location
        AND STATE = 1;

    COMMIT;

    SELECT 
        l.ID_LOCATION,
        l.ID_PROJECT,
        p.NAME AS PROJECT, 
        l.NAME,
        l.ID_ADDRESS, 
        ea.ADDRESS, 
        c.ID_COIN,
        c.SIMBOL,
        l.AMOUNT, 
        l.DATE_START, 
        l.DATE_END
    FROM location AS l
    JOIN project AS p ON p.ID_PROJECT = l.ID_PROJECT
    JOIN entity_address AS ea ON ea.ID_ADDRESS = l.ID_ADDRESS
    JOIN coin AS c ON c.ID_COIN = l.ID_COIN
    WHERE l.ID_LOCATION = p_id_location
        AND l.STATE = 1
        AND p.ID_USER = p_id_user;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_location;
DELIMITER $$
CREATE PROCEDURE sp_delete_location(
    IN p_id_user BIGINT,
    IN p_id_location BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE location 
        SET STATE = 0
    WHERE ID_LOCATION = p_id_location
        AND STATE = 1;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Locación no encontrada o ya inactiva.';
    END IF;
    
    COMMIT;
    SELECT ROW_COUNT() AS affected;
END $$
DELIMITER ;
