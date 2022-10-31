export type sqlStatement = [
    string,
    Array<string | number>
]

export type cursorDataStructure = {
    endpoint_name: string
    cursor: string
    start_timestamp: string
    latest_timestamp: string
    page_size: number
}

export type assetDataStructure = {
    id: string
    token_address: string
    token_id: string
    user_address: string
    status: string
    uri: string
    name: string | null
    description: string | null
    image_url: string | null
    metadata: string
    collection_name: string | null
    collection_icon_url: string | null
    fees: string
    created_at: string
    updated_at: string
}

export type orderDataStructure = {
    order_id: number
    status: string
    user_address: string
    sell_token_type: string
    sell_id: string | null
    sell_token_id: string | null
    sell_token_address: string
    sell_token_decimals: number | null
    sell_quantity: string
    sell_quantity_with_fees: string
    sell_properties_name: string | null
    sell_properties_image_url: string | null
    sell_properties_collection_name: string | null
    sell_properties_collection_icon_url: string | null
    buy_token_type: string
    buy_id: string | null
    buy_token_id: string | null
    buy_token_address: string
    buy_token_decimals: number | null
    buy_quantity: string
    buy_quantity_with_fees: string
    buy_properties_name: string | null
    buy_properties_image_url: string | null
    buy_properties_collection_name: string | null
    buy_properties_collection_icon_url: string | null
    amount_sold: string | null
    expiration_timestamp: string
    timestamp: string
    updated_timestamp: string
    fees: string
}

export type transferDataStructure = {
    transaction_id: number
    status: string
    user_address: string
    receiver: string
    token_type: string
    token_id: string
    id: string
    token_address: string
    decimals: number
    quantity: string
    quantity_with_fees: string
    timestamp: string
}

export type mintDataStructure = {
    transaction_id: number
    status: string
    user_address: string
    token_type: string
    id: string
    token_address: string
    token_id: string
    quantity: string
    quantity_with_fees: string
    timestamp: string
}

export type tradeDataStructure = {
    transaction_id: number
    status: string
    party_a_order_id: number
    party_a_token_type: string
    party_a_token_address: string
    party_a_sold: string
    party_b_order_id: number
    party_b_token_type: string
    party_b_token_id: string
    party_b_token_address: string
    party_b_sold: string
    timestamp: string
}