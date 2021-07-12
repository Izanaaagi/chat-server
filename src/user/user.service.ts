import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import User from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const newPost = await this.usersRepository.create(createUserDto);
    await this.usersRepository.save(newPost);
    return newPost;
  }

  async findAll(query) {
    const take: number = query.take || 10;
    const skip: number = query.skip || 0;
    const keyWord: string = query.keyWord || '';

    const [result, total] = await this.usersRepository.findAndCount({
      where: { name: Like(`%${keyWord}%`) },
      take,
      skip,
    });

    return {
      users: result,
      count: total,
    };
  }

  async getByEmail(email: string): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
    if (user) {
      return user;
    }
    throw new HttpException(
      `Use with email ${email} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ id });
    if (user) {
      return user;
    }
    throw new HttpException(
      `Use with id ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    const deleteResponse = await this.usersRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
  }
}
