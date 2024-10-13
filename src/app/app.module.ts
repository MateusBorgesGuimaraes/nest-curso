import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecadosModule } from 'src/recados/recados.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PessoasModule } from 'src/pessoas/pessoas.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      database: 'postgres',
      password: 'mateus123',
      autoLoadEntities: true, // carrega as entidades automaticamente sem precisar especificar
      synchronize: true, // sincroniza as alterações no bd. Não utilizar em produção
    }),
    RecadosModule,
    PessoasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
