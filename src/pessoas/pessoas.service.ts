import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pessoa } from './entities/pessoa.entity';
import { Repository } from 'typeorm';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class PessoasService {
  constructor(
    @InjectRepository(Pessoa)
    private readonly pessoasRepository: Repository<Pessoa>,
    private readonly hashingService: HashingService,
  ) {}

  async create(createPessoaDto: CreatePessoaDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createPessoaDto.password,
      );
      const pessoaData = {
        nome: createPessoaDto.nome,
        passwordHash,
        email: createPessoaDto.email,
      };

      const novaPessoa = this.pessoasRepository.create(pessoaData);
      await this.pessoasRepository.save(novaPessoa);
      return novaPessoa;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email ja cadastrado');
      }
      throw error;
    }
  }

  async findAll() {
    const pessoas = await this.pessoasRepository.find({
      order: {
        id: 'desc',
      },
    });

    return pessoas;
  }

  async findOne(id: number) {
    const pessoa = await this.pessoasRepository.findOneBy({ id });

    if (!pessoa) {
      throw new NotFoundException('Pessoa não encontrada');
    }

    return pessoa;
  }

  async update(
    id: number,
    updatePessoaDto: UpdatePessoaDto,
    tokenPayload: TokenPayloadDto,
  ) {
    const pessoaData = {
      nome: updatePessoaDto?.nome,
    };

    if (updatePessoaDto?.password) {
      const passwordHash = await this.hashingService.hash(
        updatePessoaDto.password,
      );

      pessoaData['passwordHash'] = passwordHash;
    }

    const pessoa = await this.pessoasRepository.preload({ id, ...pessoaData });

    if (!pessoa) {
      throw new NotFoundException('Pessoa não encontrada');
    }

    if (pessoa.id !== tokenPayload.sub) {
      throw new ForbiddenException(
        'Voce não tem permissão para alterar esta pessoa',
      );
    }
    return this.pessoasRepository.save(pessoa);
  }

  async remove(id: number, tokenPayload: TokenPayloadDto) {
    const pessoa = await this.pessoasRepository.findOneBy({ id });

    if (!pessoa) {
      throw new NotFoundException('Pessoa não encontrada');
    }

    if (pessoa.id !== tokenPayload.sub) {
      throw new ForbiddenException(
        'Voce não tem permissão para alterar esta pessoa',
      );
    }

    return this.pessoasRepository.remove(pessoa);
  }

  async uploadPicture(
    file: Express.Multer.File,
    tokenPayload: TokenPayloadDto,
  ) {
    if (file.size < 1024) {
      throw new BadRequestException('File too small');
    }

    const pessoa = await this.findOne(tokenPayload.sub);

    const fileExtension = path
      .extname(file.originalname)
      .toLocaleLowerCase()
      .substring(1);

    const fileName = `${tokenPayload.sub}.${fileExtension}`;
    const fileFullPath = path.resolve(process.cwd(), 'pictures', fileName);

    // file-type image-type sharp -> bibilioteca para trabalhar com imagem, elas leem o formato da imagem e o converte para o formato desejado

    await fs.writeFile(fileFullPath, file.buffer);

    pessoa.picture = fileName;
    await this.pessoasRepository.save(pessoa);

    return { pessoa };
  }
}
