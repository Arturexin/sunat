CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    last_name VARCHAR(70) NOT NULL,
    email VARCHAR(150) NOT NULL,
    user VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role TINYINT NOT NULL,
    date_record DATETIME NOT NULL,
    state TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO users (name, last_name, email, user, phone, password_hash, role, date_record, state) VALUES
('Arturo', 'Trejo Abarca', 'arturotrejo@hotmail.com', 'Arturex', '999999999', 'Luter123.', 1, NOW(), 1);

CREATE TABLE project (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(250) NOT NULL,
    ruc VARCHAR(20) NOT NULL,
    rs VARCHAR(250) NOT NULL,
    amount INT NOT NULL,
    date_start DATETIME NOT NULL,
    date_end DATETIME NOT NULL,
    date_record DATETIME NOT NULL,
    id_employees INT NOT NULL, 
    id_user INT NOT NULL,
    state TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE location (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(250) NOT NULL,
    address VARCHAR(250) NOT NULL,
    amount INT NOT NULL,
    date_start DATETIME NOT NULL,
    date_end DATETIME NOT NULL,
    date_record DATETIME NOT NULL,
    id_project INT NOT NULL,--
    id_user INT NOT NULL,--
    state TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE employees (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    last_name VARCHAR(70) NOT NULL,
    doc VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(100) NOT NULL,
    date_record DATETIME NOT NULL,
    id_user INT NOT NULL,--
    state TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE transit (
    id INT NOT NULL AUTO_INCREMENT,
    tipo VARCHAR(10) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    n_serie VARCHAR(20) NOT NULL,
    ruc VARCHAR(20) NOT NULL,
    rs VARCHAR(250) NOT NULL,
    concept VARCHAR(250) NOT NULL,
    amount INT(11) NOT NULL,
    e_c VARCHAR(250) NOT NULL,
    c_c VARCHAR(250) NOT NULL,
    cpe VARCHAR(250) NOT NULL,
    date_record DATETIME NOT NULL,
    id_user INT NOT NULL,--
    id_project INT NOT NULL,--
    id_location INT NOT NULL,--
    id_area INT NOT NULL,--
    id_employees INT NOT NULL,--
    state TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE area (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    amount INT NOT NULL,
    date_record DATETIME NOT NULL,
    id_location INT NOT NULL,--
    id_user INT NOT NULL,--
    state TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_bin;

-- Relaciones (al final)

ALTER TABLE project
    ADD CONSTRAINT project_user FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE location
    ADD CONSTRAINT location_user FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE employees
    ADD CONSTRAINT employees_user FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE transit
    ADD CONSTRAINT transit_user FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE area
    ADD CONSTRAINT area_user FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE location
    ADD CONSTRAINT location_project FOREIGN KEY (id_project) REFERENCES project(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE transit
    ADD CONSTRAINT transit_project FOREIGN KEY (id_project) REFERENCES project(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE transit
    ADD CONSTRAINT transit_location FOREIGN KEY (id_location) REFERENCES location(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE project
    ADD CONSTRAINT project_employees FOREIGN KEY (id_employees) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE transit
    ADD CONSTRAINT transit_employees FOREIGN KEY (id_employees) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE transit
    ADD CONSTRAINT transit_area FOREIGN KEY (id_area) REFERENCES area(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE area
    ADD CONSTRAINT area_location FOREIGN KEY (id_location) REFERENCES location (id) ON DELETE CASCADE ON UPDATE CASCADE;