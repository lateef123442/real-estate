CREATE TABLE `all_properties` (
	`properties_id` INT(11) NULL DEFAULT NULL,
	`Status` VARCHAR(50) NULL DEFAULT NULL,
	`properties_address` VARCHAR(50) NULL DEFAULT NULL,
	`owners_name` VARCHAR(50) NULL DEFAULT NULL,
	`proper_amount` VARCHAR(50) NULL DEFAULT NULL,
	`owner_email` VARCHAR(50) NULL DEFAULT NULL
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;


CREATE TABLE `homeimprovement` (
	`name` VARCHAR(50) NULL DEFAULT NULL,
	`email` VARCHAR(50) NULL DEFAULT NULL,
	`phone` VARCHAR(50) NULL DEFAULT NULL,
	`message` VARCHAR(50) NULL DEFAULT NULL
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;


CREATE TABLE `request_tour` (
	`name` VARCHAR(50) NULL DEFAULT NULL,
	`email` VARCHAR(50) NULL DEFAULT NULL,
	`phone` VARCHAR(50) NULL DEFAULT NULL,
	`date` DATE NULL DEFAULT NULL,
	`time` TIME NULL DEFAULT NULL,
	`rentSell` VARCHAR(50) NULL DEFAULT NULL,
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=23
;


CREATE TABLE `sales_approval` (
	`ownerName` VARCHAR(50) NOT NULL,
	`ownerEmail` VARCHAR(50) NOT NULL,
	`ownerPhone` VARCHAR(50) NOT NULL,
	`propertyAddress` VARCHAR(50) NOT NULL,
	`bedrooms` VARCHAR(50) NOT NULL,
	`bathrooms` VARCHAR(50) NOT NULL,
	`description` TEXT NOT NULL,
	`sqft` VARCHAR(50) NOT NULL,
	`image_data` LONGBLOB NOT NULL,
	`video` LONGBLOB NOT NULL,
	`amount` VARCHAR(50) NOT NULL,
	`title` VARCHAR(50) NOT NULL,
	`rentSell` VARCHAR(50) NOT NULL,
	`property_type` VARCHAR(50) NOT NULL,
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=59
;


CREATE TABLE `sell_images` (
	`ownerName` VARCHAR(50) NOT NULL DEFAULT '',
	`ownerEmail` VARCHAR(50) NOT NULL DEFAULT '',
	`ownerPhone` VARCHAR(50) NOT NULL DEFAULT '',
	`propertyAddress` VARCHAR(50) NOT NULL DEFAULT '',
	`bedrooms` VARCHAR(50) NOT NULL DEFAULT '0',
	`bathrooms` VARCHAR(50) NOT NULL DEFAULT '0',
	`description` TEXT NOT NULL DEFAULT '0',
	`sqft` VARCHAR(50) NOT NULL DEFAULT '0',
	`image_data` LONGBLOB NULL DEFAULT NULL,
	`video` LONGBLOB NULL DEFAULT NULL,
	`amount` VARCHAR(50) NULL DEFAULT NULL,
	`title` VARCHAR(50) NULL DEFAULT NULL,
	`rentSell` VARCHAR(50) NULL DEFAULT NULL,
	`property-type` VARCHAR(50) NULL DEFAULT NULL,
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=2
;


CREATE TABLE `signin` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`firstName` VARCHAR(50) NOT NULL,
	`middleName` VARCHAR(50) NULL DEFAULT NULL,
	`lastName` VARCHAR(50) NOT NULL,
	`email` VARCHAR(100) NOT NULL,
	`phone` VARCHAR(15) NULL DEFAULT NULL,
	`confirmPassword` VARCHAR(255) NOT NULL,
	`createdAt` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
	`updatedAt` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
	PRIMARY KEY (`id`),
	UNIQUE INDEX `email` (`email`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=9
;


CREATE TABLE `total_amount` (
	`amount_id` INT(11) NOT NULL AUTO_INCREMENT,
	`amount` INT(11) NULL DEFAULT NULL,
	PRIMARY KEY (`amount_id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=12
;
