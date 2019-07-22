import logging
from os import path
from logging import handlers


def configure_logger(
        logger_name='log',
        log_dir='./',
        to_stdout=True,
        to_file=True,
        level=logging.DEBUG,
) -> logging.Logger:
    logger = logging.getLogger(logger_name)
    logger.setLevel(level)
    logger.handlers = []

    formatter = logging.Formatter(
        '[%(asctime)s] %(filename)s %(process)4d %(levelname)5s :: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Stdout
    if to_stdout:
        stdout = logging.StreamHandler()
        stdout.setLevel(level)
        stdout.setFormatter(formatter)
        logger.addHandler(stdout)

    # Filehandler
    if to_file:
        filename = logger_name + '.log'
        log_location = path.join(log_dir, filename)
        file_handler = handlers.RotatingFileHandler(
            log_location,
            mode='a',
            maxBytes=10 ** 8,
            backupCount=1,
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        print('Log to file {}'.format(log_location))

    logger.propagate = False
    return logger
