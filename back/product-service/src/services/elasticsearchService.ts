import { Client } from '@elastic/elasticsearch';
import { Product } from '../types';

export class ElasticsearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: true
    });
  }

  // Khởi tạo index cho products
  async initializeIndex() {
    try {
      const indexName = 'products';
      
      // Kiểm tra index có tồn tại không
      const indexExists = await this.client.indices.exists({
        index: indexName
      });

      if (!indexExists) {
        // Tạo index với mapping
        await this.client.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'integer' },
                name: { 
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: { type: 'completion' }
                  }
                },
                description: { 
                  type: 'text',
                  analyzer: 'standard'
                },
                price: { type: 'float' },
                category_id: { type: 'integer' },
                category_name: { type: 'keyword' },
                images: { type: 'keyword' },
                stock: { type: 'integer' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' }
              }
            },
            settings: {
              analysis: {
                analyzer: {
                  product_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball']
                  }
                }
              }
            }
          }
        });
        console.log('✅ Elasticsearch index created successfully');
      } else {
        console.log('✅ Elasticsearch index already exists');
      }
    } catch (error) {
      console.error('❌ Error initializing Elasticsearch index:', error);
    }
  }

  // Index một sản phẩm
  async indexProduct(product: Product) {
    try {
      await this.client.index({
        index: 'products',
        id: product.id.toString(),
        body: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.category_id,
          category_name: product.categories?.name,
          images: product.images,
          stock: product.stock,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      });
      console.log(`✅ Product ${product.id} indexed successfully`);
    } catch (error) {
      console.error(`❌ Error indexing product ${product.id}:`, error);
    }
  }

  // Cập nhật sản phẩm trong index
  async updateProduct(product: Product) {
    try {
      await this.client.update({
        index: 'products',
        id: product.id.toString(),
        body: {
          doc: {
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            category_name: product.categories?.name,
            images: product.images,
            stock: product.stock,
            updated_at: product.updated_at
          }
        }
      });
      console.log(`✅ Product ${product.id} updated successfully`);
    } catch (error) {
      console.error(`❌ Error updating product ${product.id}:`, error);
    }
  }

  // Xóa sản phẩm khỏi index
  async deleteProduct(productId: number) {
    try {
      await this.client.delete({
        index: 'products',
        id: productId.toString()
      });
      console.log(`✅ Product ${productId} deleted from index`);
    } catch (error) {
      console.error(`❌ Error deleting product ${productId}:`, error);
    }
  }

  // Tìm kiếm sản phẩm
  async searchProducts(query: string, filters: any = {}) {
    try {
      const searchBody: any = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['name^2', 'description'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: []
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { created_at: { order: 'desc' } }
        ]
      };

      // Thêm filters
      if (filters.category_id) {
        searchBody.query.bool.filter.push({
          term: { category_id: filters.category_id }
        });
      }

      if (filters.minPrice || filters.maxPrice) {
        const rangeFilter: any = { price: {} };
        if (filters.minPrice) rangeFilter.price.gte = filters.minPrice;
        if (filters.maxPrice) rangeFilter.price.lte = filters.maxPrice;
        searchBody.query.bool.filter.push({ range: rangeFilter });
      }

      if (filters.inStock) {
        searchBody.query.bool.filter.push({
          range: { stock: { gt: 0 } }
        });
      }

      // Thêm pagination
      if (filters.page && filters.limit) {
        searchBody.from = (filters.page - 1) * filters.limit;
        searchBody.size = filters.limit;
      }

      const result = await this.client.search({
        index: 'products',
        body: searchBody
      });

      return {
        products: result.hits.hits.map((hit: any) => ({
          ...hit._source,
          score: hit._score
        })),
        total: result.hits.total?.valueOf,
        took: result.took
      };
    } catch (error) {
      console.error('❌ Error searching products:', error);
      throw error;
    }
  }

  // Tìm kiếm gợi ý (autocomplete)
  async suggestProducts(query: string) {
    try {
      const result = await this.client.search({
        index: 'products',
        body: {
          suggest: {
            product_suggestions: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size: 5,
                skip_duplicates: true
              }
            }
          }
        }
      });

    const options = result.suggest?.product_suggestions?.[0]?.options;
    if (Array.isArray(options) && options.length > 0) {
      return options.map(opt => ({
        text: opt.text,
        score: opt.score
      }));
    }
    return [];

    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
      return [];
    }
  }

  // Bulk index nhiều sản phẩm
  async bulkIndexProducts(products: Product[]) {
    try {
      const operations = products.flatMap(product => [
        { index: { _index: 'products', _id: product.id.toString() } },
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.category_id,
          category_name: product.categories?.name,
          images: product.images,
          stock: product.stock,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      ]);

      const result = await this.client.bulk({ body: operations });
      
      if (result.errors) {
        console.error('❌ Some errors occurred during bulk indexing:', result.items);
      } else {
        console.log(`✅ Bulk indexed ${products.length} products successfully`);
      }
    } catch (error) {
      console.error('❌ Error bulk indexing products:', error);
    }
  }

  // Kiểm tra kết nối
  async healthCheck() {
    try {
      const health = await this.client.cluster.health();
      return {
        status: health.status,
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards
      };
    } catch (error) {
      console.error('❌ Elasticsearch health check failed:', error);
      return null;
    }
  }
}

export const elasticsearchService = new ElasticsearchService(); 