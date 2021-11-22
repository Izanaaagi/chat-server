import { HttpException, HttpStatus } from '@nestjs/common';

const fileFilter = function (req, file, cb) {
  const typeArray = file.mimetype.split('/');
  const fileType = typeArray[1];
  if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') {
    cb(null, true);
  } else {
    cb(
      new HttpException(
        'Incorrect file format',
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
    );
  }
};

export const multerOptions = {
  limits: { fileSize: 1024 * 1024 },
  fileFilter: fileFilter,
};
